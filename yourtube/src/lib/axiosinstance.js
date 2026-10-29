import axios from "axios";
import { auth } from "./firebase";

const baseURL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:5001";

const axiosInstance = axios.create({ baseURL });

axiosInstance.interceptors.request.use(async (config) => {
  const activeUser = auth.currentUser;
  if (activeUser) {
    config.headers.Authorization = "Bearer " + (await activeUser.getIdToken());
  }
  return config;
});

export default axiosInstance;
