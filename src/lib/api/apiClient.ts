import axios from "axios";


const axiosClient = axios.create({
  //baseURL: "http://10.0.0.126:8080",
  baseURL: "http://localhost:8082",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});


// axiosClient.interceptors.request.use(
//   async function (request) {
//     const accessToken = await SecureStore.getItemAsync("userAccessToken");

//     if (accessToken) {
//       request.headers["Authorization"] = `Bearer ${accessToken}`;
//     }

//     request.headers["Client-Id"] = "mobile-user";
//     request.headers["Platform"] = Platform.OS === "ios" ? "iOS" : "Android";
//     return request;
//   },
//   function (error) {
//     return Promise.reject(error);
//   }
// );

export default axiosClient;
