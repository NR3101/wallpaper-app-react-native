import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Pressable,
  Alert,
  Text,
} from "react-native";
import React, { useState } from "react";
import { BlurView } from "expo-blur";
import { hp, wp } from "../../helpers/common";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { theme } from "../../constants/theme";
import { Entypo, Octicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import * as MediaLibrary from "expo-media-library";

const ImageScreen = () => {
  const [status, setStatus] = useState("loading");
  const router = useRouter();
  const item = useLocalSearchParams();
  let uri = item?.webformatURL;
  const fileName = item?.previewURL.split("/").pop();
  const imageUrl = uri;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  //func to set status
  const onLoad = () => {
    setStatus("");
  };

  //func to get dynamic size of image
  const getSize = () => {
    const aspectRatio = item?.imageWidth / item?.imageHeight;
    const maxWidth = Platform.OS === "web" ? wp(50) : wp(92);
    let calculatedHeight = maxWidth / aspectRatio;
    let calculatedWidth = maxWidth;

    if (aspectRatio < 1) {
      // portrait
      calculatedWidth = calculatedHeight * aspectRatio;
    }
    return {
      width: calculatedWidth,
      height: calculatedHeight,
    };
  };

  //func to download image
  const handleDownloadImage = async () => {
    setStatus("downloading");
    let uri = await downloadFile();

    if (uri) {
      showToast("Image downloaded successfully");
    }
  };

  //func to download file
  const downloadFile = async () => {
    try {
      const { uri } = await FileSystem.downloadAsync(imageUrl, filePath);

      setStatus("");
      saveFile(uri);

      return uri;
    } catch (error) {
      console.log("download file error", error.message);
      setStatus("");
      Alert.alert("Image", error.message);
      return null;
    }
  };

  //func to check permissions
  const checkPermissions = async () => {
    let { status } = await MediaLibrary.getPermissionsAsync();

    if (status !== "granted") {
      const permissions = await MediaLibrary.requestPermissionsAsync();
      status = permissions.status;
    }

    return status;
  };

  //func to save file
  const saveFile = async (fileUri) => {
    const status = await checkPermissions();

    if (status === "granted") {
      try {
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        const album = await MediaLibrary.getAlbumAsync("Download");

        if (album == null) {
          await MediaLibrary.createAlbumAsync("Download", asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (err) {
        console.log("Save err: ", err);
        Toast.show({
          type: "error",
          text1: `Error: ${err.message}`,
          position: "bottom",
        });
      }
    } else if (status === "denied") {
      Toast.show({
        type: "info",
        text1: "Please allow permissions to download.",
        position: "bottom",
      });
    }
  };

  //func to show toast
  const showToast = (msg) => {
    Toast.show({
      type: "success",
      text1: msg,
      position: "bottom",
    });
  };

  const toastConfig = {
    success: ({ text1, props, ...rest }) => (
      <View style={styles.toast}>
        <Text style={styles.toastText}>{text1}</Text>
      </View>
    ),
  };

  //func to share image
  const handleShareImage = async () => {
    setStatus("sharing");
    let uri = await downloadFile();

    if (uri) {
      await Sharing.shareAsync(uri);
    }
  };

  return (
    <BlurView style={styles.container} tint="dark" intensity={60}>
      <View style={getSize()}>
        <View style={styles.loading}>
          {status === "loading" && (
            <ActivityIndicator size="large" color="white" />
          )}
        </View>
        <Image
          transition={100}
          style={[styles.image, getSize()]}
          source={uri}
          onLoad={onLoad}
        />
      </View>

      {/* action buttons */}
      <View style={styles.buttons}>
        <Animated.View entering={FadeInDown.springify()}>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Octicons name="x" size={24} color="white" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(100)}>
          {status === "downloading" ? (
            <View style={styles.button}>
              <ActivityIndicator size="small" color="white" />
            </View>
          ) : (
            <Pressable style={styles.button} onPress={handleDownloadImage}>
              <Octicons name="download" size={24} color="white" />
            </Pressable>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(200)}>
          {status === "sharing" ? (
            <View style={styles.button}>
              <ActivityIndicator size="small" color="white" />
            </View>
          ) : (
            <Pressable style={styles.button} onPress={handleShareImage}>
              <Entypo name="share" size={24} color="white" />
            </Pressable>
          )}
        </Animated.View>
      </View>

      <Toast config={toastConfig} visibilityTime={2500} />
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(4),
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  image: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  loading: {
    position: "absolute",
    top: "50%",
    left: "50%",
  },
  buttons: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 50,
  },
  button: {
    height: hp(7),
    width: hp(7),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: theme.radius.lg,
    borderCurve: "continuous",
  },
  toast: {
    padding: 15,
    paddingHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: theme.radius.xl,
  },
  toastText: {
    fontSize: hp(1.8),
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.white,
  },
});

export default ImageScreen;
