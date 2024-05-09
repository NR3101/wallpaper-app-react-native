import axios from "axios";

const API_KEY = "43763529-36cdb108be1c32eb49ca5b97a";
const API_URL = `https://pixabay.com/api/?key=${API_KEY}`;

const formatUrl = (params) => {
  let url = API_URL + "&per_page=26&safesearch=true&editors_choice=true";
  if (!params) return url;
  let paramKeys = Object.keys(params);

  paramKeys.map((key) => {
    let value = key === "q" ? encodeURIComponent(params[key]) : params[key];
    url += `&${key}=${value}`;
  });

  return url;
};

export const apiCall = async (params) => {
  try {
    const res = await axios.get(formatUrl(params));
    const { data } = res;
    return { success: true, data: data };
  } catch (error) {
    console.error(error.message);
    return { success: false, msg: error.message };
  }
};
