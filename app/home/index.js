import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  StatusBar,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import { hp, wp } from "../../helpers/common";
import { ScrollView } from "react-native";
import Categories from "../../components/Categories";
import { apiCall } from "../../api";
import ImageGrid from "../../components/ImageGrid";
import { debounce } from "lodash";
import FiltersModal from "../../components/FiltersModal";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

let page = 1;

const HomeScreen = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [images, setImages] = useState([]);
  const [filters, setFilters] = useState(null);
  const [isEndReached, setIsEndReached] = useState(false); //to check if end of images is reached
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);
  const scrollRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    fetchImages();
  }, []);

  const { top } = useSafeAreaInsets();
  const paddingTop = top > 0 ? top + 10 : 30;

  // function to fetch images from api
  const fetchImages = async (params = { page: 1 }, append = true) => {
    // console.log("fetch images", params, append);
    let result = await apiCall(params);
    if (result.success && result?.data?.hits) {
      if (append) {
        setImages([...images, ...result.data.hits]);
      } else {
        setImages(result.data.hits);
      }
    }
  };

  // function to open filters modal
  const openFiltersModal = () => {
    modalRef?.current?.present();
  };

  // function to close filters modal
  const closeFiltersModal = () => {
    modalRef?.current?.close();
  };

  // function to apply filters
  const applyFilters = () => {
    if (filters) {
      page = 1;
      setImages([]);
      let params = { page, ...filters };
      if (activeCategory) params.category = activeCategory;
      if (search) params.q = search;
      fetchImages(params, false);
    }
    closeFiltersModal();
  };

  // function to reset filters
  const resetFilters = () => {
    if (filters) {
      page = 1;
      setFilters(null);
      setImages([]);
      let params = { page };
      if (activeCategory) params.category = activeCategory;
      if (search) params.q = search;
      fetchImages(params, false);
    }
    closeFiltersModal();
  };

  // function to clear a filter
  const clearThisFilter = (filterName) => {
    let newFilters = { ...filters };
    delete newFilters[filterName];
    setFilters(newFilters);
    page = 1;
    setImages([]);
    let params = { page, ...newFilters };
    if (activeCategory) params.category = activeCategory;
    if (search) params.q = search;
    fetchImages(params, false);
  };

  // function to handle active category change
  const handleChangeCategory = (category) => {
    setActiveCategory(category);
    clearSearch();
    setImages([]);
    page = 1;
    let params = { page, ...filters };

    if (category) {
      params.category = category;
    }
    fetchImages(params, false);
  };

  // function to handle search
  const handleSearch = (text) => {
    // console.log("search", text);
    setSearch(text);
    if (text.length > 2) {
      //search images
      page = 1;
      setImages([]);
      setActiveCategory(null); //clear active category while searching
      fetchImages({ page, q: text, ...filters }, false);
    }

    if (text == "") {
      //reset search results
      page = 1;
      searchInputRef?.current?.clear();
      setImages([]);
      setActiveCategory(null); //clear active category while searching
      fetchImages({ page, ...filters }, false);
    }
  };

  // function to clear search input
  const clearSearch = () => {
    setSearch("");
    searchInputRef?.current?.clear();
  };

  // debounce search to avoid multiple api calls
  const handleTextDebounce = useCallback(debounce(handleSearch, 500), []);

  // function to scroll to top
  const handleScrollToTop = () => {
    scrollRef?.current?.scrollTo({ y: 0, animated: true });
  };

  // function to handle scroll
  const handleScroll = (event) => {
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    const scrollOffset = event.nativeEvent.contentOffset.y;
    const bottomPosition = contentHeight - scrollViewHeight;

    if (scrollOffset >= bottomPosition - 1) {
      if (!isEndReached) {
        setIsEndReached(true);
        //fetch more images
        ++page;
        let params = { page, ...filters };
        if (activeCategory) params.category = activeCategory;
        if (search) params.q = search;
        fetchImages(params);
      }
    } else if (isEndReached) {
      setIsEndReached(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop }]}>
      {/* header */}
      <View style={styles.header}>
        <Pressable onPress={handleScrollToTop}>
          <Text style={styles.title}>Pixels</Text>
        </Pressable>
        <Pressable onPress={openFiltersModal}>
          <FontAwesome6
            name="bars-staggered"
            size={22}
            color={theme.colors.neutral(0.7)}
          />
        </Pressable>
      </View>

      {/* content */}
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={5} //how often scroll event is fired while scrolling (in ms)
        ref={scrollRef}
        contentContainerStyle={{ gap: 15 }}
        showsVerticalScrollIndicator={false}
      >
        {/* search bar */}
        <View style={styles.searchBar}>
          <View style={styles.searchIcon}>
            <Feather
              name="search"
              size={24}
              color={theme.colors.neutral(0.4)}
            />
          </View>
          <TextInput
            placeholder="Search for photos...."
            style={styles.searchInput}
            ref={searchInputRef}
            onChangeText={handleTextDebounce}
          />
          {search.length > 0 && (
            <Pressable
              style={styles.closeIcon}
              onPress={() => handleSearch("")}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.neutral(0.6)}
              />
            </Pressable>
          )}
        </View>

        {/* categories */}
        <View style={styles.categories}>
          <Categories
            activeCategory={activeCategory}
            handleChangeCategory={handleChangeCategory}
          />
        </View>

        {/* applied filters */}
        {filters && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              {Object.keys(filters).map((key, index) => {
                return (
                  <View key={key} style={styles.filterItem}>
                    {key === "colors" ? (
                      <View
                        style={{
                          width: 30,
                          height: 20,
                          borderRadius: 7,
                          backgroundColor: filters[key],
                        }}
                      />
                    ) : (
                      <Text style={styles.filterName}>{filters[key]}</Text>
                    )}

                    <Pressable
                      style={styles.clearFilterIcon}
                      onPress={() => clearThisFilter(key)}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color={theme.colors.neutral(0.9)}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* images grid */}
        <View>
          {images.length > 0 && <ImageGrid images={images} router={router} />}
        </View>

        {/* loading */}
        <View
          style={{ marginBottom: 70, marginTop: images.length > 0 ? 10 : 70 }}
        >
          <ActivityIndicator size="large" color={theme.colors.neutral(0.7)} />
        </View>
      </ScrollView>

      {/* filters modal */}
      <FiltersModal
        modalRef={modalRef}
        filters={filters}
        setFilters={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
        onClose={closeFiltersModal}
      />
      <StatusBar barStyle="dark-content" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 15,
  },
  header: {
    marginHorizontal: wp(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.neutral(0.9),
  },
  searchBar: {
    marginHorizontal: wp(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.grayBG,
    backgroundColor: theme.colors.white,
    padding: 6,
    paddingLeft: 10,
    borderRadius: theme.radius.lg,
  },
  searchIcon: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    fontSize: hp(2),
  },
  closeIcon: {
    backgroundColor: theme.colors.neutral(0.1),
    padding: 8,
    borderRadius: theme.radius.sm,
  },
  filters: {
    paddingHorizontal: wp(4),
    gap: 10,
  },
  filterItem: {
    backgroundColor: theme.colors.grayBG,
    padding: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.xs,
    gap: 10,
  },
  filterName: {
    fontSize: hp(1.9),
    color: theme.colors.neutral(0.8),
  },
  clearFilterIcon: {
    backgroundColor: theme.colors.neutral(0.2),
    padding: 4,
    borderRadius: 7,
  },
});

export default HomeScreen;
