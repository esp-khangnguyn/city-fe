import axiosInstance from "./api";

export const getCitizens = async (params = {}) => {
  try {
    // Create query parameters for the API
    const queryParams = {};

    // Map frontend filter names to backend expected names if needed
    if (params.name) queryParams.name = params.name;
    if (params.mother_name) queryParams.mother_name = params.mother_name;
    if (params.father_name) queryParams.father_name = params.father_name;
    if (params.birth_date_from)
      queryParams.birth_date_from = params.birth_date_from;
    if (params.birth_date_to) queryParams.birth_date_to = params.birth_date_to;
    if (params.birth_city) queryParams.birth_city = params.birth_city;
    if (params.gender) queryParams.gender = params.gender;
    if (params.address_city) queryParams.address_city = params.address_city;
    if (params.search) queryParams.search = params.search;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    const res = await axiosInstance.get("/", { params: queryParams });
    return res.data;
  } catch (error) {
    console.error("Error fetching citizens:", error);
    throw error;
  }
};

export const createCitizen = async (data) => {
  try {
    const res = await axiosInstance.post("/", data);
    return res.data;
  } catch (error) {
    console.error("Error creating citizen:", error);
    throw error;
  }
};

export const searchCitizens = async (query, params = {}) => {
  try {
    const res = await axiosInstance.get(`/search`, {
      params: { query, ...params },
    });
    return res.data;
  } catch (error) {
    console.error("Error searching citizens:", error);
    throw error;
  }
};

export const getAllCities = async () => {
  try {
    const res = await axiosInstance.get("/cities");
    return res.data;
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
};
