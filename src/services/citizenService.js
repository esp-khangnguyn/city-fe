import axiosInstance from "./api";

export const getCitizens = async (params = {}) => {
  try {
    // Create query parameters for the API
    const queryParams = {};

    // Map frontend filter names to backend expected names if needed
    if (params.first_name) queryParams.first_name = params.first_name.trim();
    if (params.last_name) queryParams.last_name = params.last_name.trim();
    if (params.mother_name) queryParams.mother_name = params.mother_name.trim();
    if (params.father_name) queryParams.father_name = params.father_name.trim();
    if (params.birth_date_from)
      queryParams.birth_date_from = params.birth_date_from;
    if (params.birth_date_to) queryParams.birth_date_to = params.birth_date_to;
    if (params.birth_city) queryParams.birth_city = params.birth_city.trim();
    if (params.gender) queryParams.gender = params.gender.trim();
    if (params.address_city)
      queryParams.address_city = params.address_city.trim();
    if (params.search) queryParams.search = params.search.trim();
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.national_identifier)
      queryParams.national_identifier = params.national_identifier;

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
