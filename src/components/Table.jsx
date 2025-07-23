import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Space,
  Button,
  Tag,
  Avatar,
  Card,
  Select,
  DatePicker,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  CalendarOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { getCitizens } from "../services/citizenService";

// Custom hook for debouncing values
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const CustomTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  const [cities, setCities] = useState([]);

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: "",
    first_name: "",
    last_name: "",
    mother_name: "",
    father_name: "",
    national_identifier: "",
    birth_date_from: "",
    birth_date_to: "",
    birth_city: "",
    gender: "",
    address_city: "",
    dateRange: null,
  });

  // Debounced search values (500ms delay)
  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedName = useDebounce(filters.name, 500);
  const debouncedMotherName = useDebounce(filters.mother_name, 500);
  const debouncedFatherName = useDebounce(filters.father_name, 500);
  const debouncedNationalIdentifier = useDebounce(
    filters.national_identifier,
    500
  );

  const fetchData = async (page = 1, pageSize = 10, currentFilters = {}) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pageSize,
        ...currentFilters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (
          params[key] === "" ||
          params[key] === null ||
          params[key] === undefined
        ) {
          delete params[key];
        }
      });

      // Remove dateRange from params as it's used to set birth_date_from and birth_date_to
      delete params.dateRange;

      console.log("🚀 ~ fetchData ~ params:", params);

      const response = await getCitizens(params);
      console.log("🚀 ~ fetchData ~ response:", response);

      // Handle different response structures
      let citizensData = [];
      let total = 0;
      let currentPage = page;
      let currentPageSize = pageSize;

      if (response && response.citizens && Array.isArray(response.citizens)) {
        // Paginated response from backend
        citizensData = response.citizens;
        total = response.pagination
          ? response.pagination.total
          : response.citizens.length;
        currentPage = response.pagination ? response.pagination.page : page;
        currentPageSize = response.pagination
          ? response.pagination.limit
          : pageSize;
        console.log(
          "🚀 ~ fetchData ~ paginated response - total:",
          total,
          "current page:",
          currentPage
        );
      } else if (Array.isArray(response)) {
        // Direct array response
        citizensData = response;
        total = response.length;
      } else {
        // No data found
        citizensData = [];
        total = 0;
      }

      // Transform data for table (no client-side filtering needed as backend handles it)
      const transformedData = citizensData.map((citizen, index) => ({
        key: citizen.uid || citizen.id || `${currentPage}-${index}`,
        uid: citizen.uid,
        national_identifier: citizen.national_identifier,
        first: citizen.first,
        last: citizen.last,
        mother_first: citizen.mother_first,
        father_first: citizen.father_first,
        gender: citizen.gender,
        birth_city: citizen.birth_city,
        date_of_birth: citizen.date_of_birth,
        id_registration_city: citizen.id_registration_city,
        id_registration_district: citizen.id_registration_district,
        address_city: citizen.address_city,
        address_district: citizen.address_district,
        address_neighborhood: citizen.address_neighborhood,
        street_address: citizen.street_address,
        door_or_entrance_number: citizen.door_or_entrance_number,
      }));

      setData(transformedData);
      setPagination((prev) => ({
        ...prev,
        current: currentPage,
        pageSize: currentPageSize,
        total: total,
      }));
    } catch (error) {
      console.error("Error fetching citizens:", error);
      // Clear data on error
      setData([]);
      setPagination((prev) => ({
        ...prev,
        total: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10, {});

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    // Fetch cities for dropdowns from existing citizen data
    const fetchCities = async () => {
      try {
        // Get initial data to extract unique cities
        const response = await getCitizens({ limit: 1000 }); // Get more data to extract cities
        if (response && response.citizens && Array.isArray(response.citizens)) {
          const birthCities = new Set();
          const addressCities = new Set();

          response.citizens.forEach((citizen) => {
            if (citizen.birth_city) birthCities.add(citizen.birth_city);
            if (citizen.address_city) addressCities.add(citizen.address_city);
          });

          // Combine both sets and sort
          const allCities = new Set([...birthCities, ...addressCities]);
          setCities(Array.from(allCities).sort());
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        // Set default Turkish cities if API fails
        setCities([
          "Istanbul",
          "Ankara",
          "Izmir",
          "Bursa",
          "Antalya",
          "Adana",
          "Konya",
          "Gaziantep",
          "Mersin",
          "Diyarbakir",
          "Kayseri",
          "Eskisehir",
          "Urfa",
          "Malatya",
          "Erzurum",
        ]);
      }
    };

    fetchCities();
  }, []);

  // Effect to handle debounced text search
  useEffect(() => {
    // Skip if no debounced values
    if (
      !debouncedSearch &&
      !debouncedName &&
      !debouncedMotherName &&
      !debouncedFatherName &&
      !debouncedNationalIdentifier
    ) {
      setSearchLoading(false);
      return;
    }

    // Show search loading when there's a difference between current and debounced
    const hasTypingInProgress =
      filters.search !== debouncedSearch ||
      filters.name !== debouncedName ||
      filters.mother_name !== debouncedMotherName ||
      filters.father_name !== debouncedFatherName ||
      filters.national_identifier !== debouncedNationalIdentifier;

    setSearchLoading(hasTypingInProgress);

    // Only make API call when debounced values are stable
    if (!hasTypingInProgress) {
      // Create current filter state with debounced text values
      const currentFilters = {
        search: debouncedSearch,
        name: debouncedName,
        mother_name: debouncedMotherName,
        father_name: debouncedFatherName,
        national_identifier: debouncedNationalIdentifier,
        birth_date_from: filters.birth_date_from,
        birth_date_to: filters.birth_date_to,
        birth_city: filters.birth_city,
        gender: filters.gender,
        address_city: filters.address_city,
        dateRange: filters.dateRange,
      };

      setPagination((prev) => ({ ...prev, current: 1 }));
      fetchData(1, pagination.pageSize, currentFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    debouncedName,
    debouncedMotherName,
    debouncedFatherName,
    debouncedNationalIdentifier,
  ]);

  // Handle search without immediate API call
  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);

    // For non-debounced filters (dropdowns, etc.), fetch immediately
    if (
      ![
        "name",
        "mother_name",
        "father_name",
        "search",
        "national_identifier",
      ].includes(filterType)
    ) {
      setPagination((prev) => ({ ...prev, current: 1 }));
      fetchData(1, pagination.pageSize, newFilters);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (dates, dateStrings) => {
    const newFilters = {
      ...filters,
      birth_date_from: dateStrings[0] || "",
      birth_date_to: dateStrings[1] || "",
      dateRange: dates,
    };
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 })); // Reset to page 1
    fetchData(1, pagination.pageSize, newFilters);
  };

  // Reset filters
  const handleResetFilters = () => {
    const resetFilters = {
      search: "",
      name: "",
      mother_name: "",
      father_name: "",
      national_identifier: "",
      birth_date_from: "",
      birth_date_to: "",
      birth_city: "",
      gender: "",
      address_city: "",
      dateRange: null,
    };
    setFilters(resetFilters);
    setPagination((prev) => ({ ...prev, current: 1 })); // Reset to page 1
    fetchData(1, pagination.pageSize, {});
  };

  const columns = [
    {
      title: (
        <div className="flex items-center gap-1">
          <UserOutlined />
          <span>Name</span>
        </div>
      ),
      key: "name",
      width: 100,
      fixed: "left",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-medium text-gray-800 text-sm">
              {`${record.first || ""} ${record.last || ""}`.trim() || "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <IdcardOutlined />
          <span>National ID</span>
        </div>
      ),
      dataIndex: "national_identifier",
      key: "national_identifier",
      width: 140,
      render: (text) => (
        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
          {text || "N/A"}
        </code>
      ),
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      width: 80,
      render: (gender) => (
        <Tag
          color={gender === "M" ? "blue" : gender === "F" ? "pink" : "default"}
          className="text-xs"
        >
          {gender === "E" ? "E" : gender === "K" ? "K" : gender || "N/A"}
        </Tag>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-1">
          <CalendarOutlined />
          <span>Birth Date</span>
        </div>
      ),
      dataIndex: "date_of_birth",
      key: "date_of_birth",
      width: 120,
      render: (date) => (
        <div className="text-xs">
          {date ? (
            <>
              <div>{dayjs(date).format("DD/MM/YYYY")}</div>
              <div className="text-gray-500">
                Age: {dayjs().diff(dayjs(date), "year")}
              </div>
            </>
          ) : (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-1">
          <EnvironmentOutlined />
          <span>Birth City</span>
        </div>
      ),
      dataIndex: "birth_city",
      key: "birth_city",
      width: 120,
      render: (city) => (
        <Tag color="green" className="text-xs">
          {city || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Parents",
      key: "parents",
      width: 90,
      render: (_, record) => (
        <div className="text-xs space-y-1">
          {record.mother_first && (
            <div className="text-pink-600">M: {record.mother_first}</div>
          )}
          {record.father_first && (
            <div className="text-blue-600">F: {record.father_first}</div>
          )}
          {!record.mother_first && !record.father_first && (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-1">
          <EnvironmentOutlined />
          <span>Address</span>
        </div>
      ),
      key: "address",
      width: 200,
      render: (_, record) => (
        <div className="text-xs space-y-1">
          {record.address_city && (
            <div className="font-medium">{record.address_city}</div>
          )}
          {record.address_district && (
            <div className="text-gray-600">{record.address_district}</div>
          )}
          {record.address_neighborhood && (
            <div className="text-gray-500">{record.address_neighborhood}</div>
          )}
          {record.street_address && (
            <div className="text-gray-500">{record.street_address}</div>
          )}
          {!record.address_city &&
            !record.address_district &&
            !record.address_neighborhood &&
            !record.street_address && (
              <span className="text-gray-400">N/A</span>
            )}
        </div>
      ),
    },
    {
      title: "Registration",
      key: "registration",
      width: 150,
      render: (_, record) => (
        <div className="text-xs space-y-1">
          {record.id_registration_city && (
            <div className="font-medium">{record.id_registration_city}</div>
          )}
          {record.id_registration_district && (
            <div className="text-gray-600">
              {record.id_registration_district}
            </div>
          )}
          {!record.id_registration_city && !record.id_registration_district && (
            <span className="text-gray-400">N/A</span>
          )}
        </div>
      ),
    },
    {
      title: "Door Number",
      dataIndex: "door_or_entrance_number",
      key: "door_or_entrance_number",
      width: 100,
      render: (text) => text || <span className="text-gray-400">N/A</span>,
    },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full">
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden w-full">
          <div className="mb-4 sm:mb-6 text-center px-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Citizens Database
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Manage and search citizen information
            </p>
          </div>

          {/* Search and Filters Section */}
          <div className="mb-6 px-2">
            <Row gutter={[16, 16]}>
              {/* Name Filter */}
              <Col xs={12} sm={6} md={4}>
                <Input
                  placeholder="First Name"
                  allowClear
                  prefix={<UserOutlined />}
                  size={windowWidth < 768 ? "middle" : "large"}
                  value={filters.first_name}
                  onChange={(e) =>
                    handleFilterChange("first_name", e.target.value)
                  }
                />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Input
                  placeholder="LastName"
                  allowClear
                  prefix={<UserOutlined />}
                  size={windowWidth < 768 ? "middle" : "large"}
                  value={filters.last_name}
                  onChange={(e) =>
                    handleFilterChange("last_name", e.target.value)
                  }
                />
              </Col>

              {/* Mother Name Filter */}
              <Col xs={12} sm={6} md={4}>
                <Input
                  placeholder="Mother Name"
                  allowClear
                  prefix={<UserOutlined style={{ color: "#ec4899" }} />}
                  size={windowWidth < 768 ? "middle" : "large"}
                  value={filters.mother_name}
                  onChange={(e) =>
                    handleFilterChange("mother_name", e.target.value)
                  }
                />
              </Col>

              {/* Father Name Filter */}
              <Col xs={12} sm={6} md={4}>
                <Input
                  placeholder="Father Name"
                  allowClear
                  prefix={<UserOutlined style={{ color: "#3b82f6" }} />}
                  size={windowWidth < 768 ? "middle" : "large"}
                  value={filters.father_name}
                  onChange={(e) =>
                    handleFilterChange("father_name", e.target.value)
                  }
                />
              </Col>

              {/* National Identifier Filter */}
              <Col xs={12} sm={6} md={4}>
                <Input
                  placeholder="National ID"
                  allowClear
                  prefix={<IdcardOutlined />}
                  size={windowWidth < 768 ? "middle" : "large"}
                  value={filters.national_identifier}
                  onChange={(e) =>
                    handleFilterChange("national_identifier", e.target.value)
                  }
                />
              </Col>

              {/* Date of Birth Range */}
              <Col xs={24} sm={12} md={8}>
                <DatePicker.RangePicker
                  picker="year"
                  placeholder={["Birth Date From", "Birth Date To"]}
                  format="YYYY"
                  size={windowWidth < 768 ? "middle" : "large"}
                  className="w-full"
                  value={filters.dateRange}
                  onChange={handleDateRangeChange}
                />
              </Col>

              {/* Birth City Filter */}
              <Col xs={12} sm={6} md={4}>
                <Select
                  placeholder="Birth City"
                  allowClear
                  showSearch
                  value={filters.birth_city || undefined}
                  onChange={(value) => handleFilterChange("birth_city", value)}
                  size={windowWidth < 768 ? "middle" : "large"}
                  className="w-full"
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {cities.map((city) => (
                    <Select.Option key={city} value={city}>
                      {city}
                    </Select.Option>
                  ))}
                </Select>
              </Col>

              {/* Gender Filter */}
              <Col xs={12} sm={6} md={4}>
                <Select
                  placeholder="Gender"
                  allowClear
                  value={filters.gender || undefined}
                  onChange={(value) => handleFilterChange("gender", value)}
                  size={windowWidth < 768 ? "middle" : "large"}
                  className="w-full"
                >
                  <Select.Option value="E">Male</Select.Option>
                  <Select.Option value="K">Female</Select.Option>
                </Select>
              </Col>

              {/* Address City Filter */}
              <Col xs={12} sm={6} md={4}>
                <Select
                  placeholder="Address City"
                  allowClear
                  showSearch
                  value={filters.address_city || undefined}
                  onChange={(value) =>
                    handleFilterChange("address_city", value)
                  }
                  size={windowWidth < 768 ? "middle" : "large"}
                  className="w-full"
                  filterOption={(input, option) =>
                    option.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {cities.map((city) => (
                    <Select.Option key={city} value={city}>
                      {city}
                    </Select.Option>
                  ))}
                </Select>
              </Col>

              {/* Reset Filters Button */}
              <Col xs={24} sm={12} md={4}>
                <Space className="w-full">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleResetFilters}
                    size={windowWidth < 768 ? "middle" : "large"}
                    className="w-full"
                  >
                    Reset Filters
                  </Button>
                </Space>
              </Col>
            </Row>

            {/* Filter Summary */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {/* Show search loading indicator */}
                {searchLoading && (
                  <Tag color="orange" className="mb-1 animate-pulse">
                    🔍 Searching...
                  </Tag>
                )}
                {/* Show current search terms */}
                {debouncedSearch && !searchLoading && (
                  <Tag color="green" className="mb-1">
                    Search: {debouncedSearch}
                  </Tag>
                )}
                {debouncedName && !searchLoading && (
                  <Tag color="green" className="mb-1">
                    Name: {debouncedName}
                  </Tag>
                )}
                {debouncedMotherName && !searchLoading && (
                  <Tag color="green" className="mb-1">
                    Mother: {debouncedMotherName}
                  </Tag>
                )}
                {debouncedFatherName && !searchLoading && (
                  <Tag color="green" className="mb-1">
                    Father: {debouncedFatherName}
                  </Tag>
                )}
                {debouncedNationalIdentifier && !searchLoading && (
                  <Tag color="green" className="mb-1">
                    National ID: {debouncedNationalIdentifier}
                  </Tag>
                )}
                {Object.entries(filters).map(([key, value]) => {
                  if (
                    value &&
                    key !== "dateRange" &&
                    ![
                      "search",
                      "name",
                      "mother_name",
                      "father_name",
                      "national_identifier",
                    ].includes(key)
                  ) {
                    return (
                      <Tag
                        key={key}
                        closable
                        onClose={() => handleFilterChange(key, "")}
                        color="blue"
                        className="mb-1"
                      >
                        {key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        : {value}
                      </Tag>
                    );
                  }
                  return null;
                })}
                {filters.dateRange && filters.dateRange[0] && (
                  <Tag
                    closable
                    onClose={() => handleDateRangeChange(null, ["", ""])}
                    color="purple"
                    className="mb-1"
                  >
                    Birth Date:{" "}
                    {dayjs(filters.dateRange[0]).format("DD/MM/YYYY")} -{" "}
                    {dayjs(filters.dateRange[1]).format("DD/MM/YYYY")}
                  </Tag>
                )}
              </div>
            </div>
          </div>

          <div className="w-full">
            <Table
              columns={columns}
              dataSource={data}
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: windowWidth >= 768,
                showQuickJumper: windowWidth >= 768,
                showTotal: (total, range) => {
                  if (total === 0) {
                    return "No data found";
                  }
                  return windowWidth >= 768
                    ? `${range[0]}-${range[1]} of ${total} citizens`
                    : `${range[0]}-${range[1]} / ${total}`;
                },
                responsive: true,
                showLessItems: true,
                simple: windowWidth < 480,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: (page, pageSize) => {
                  fetchData(page, pageSize, filters);
                },
                onShowSizeChange: (current, size) => {
                  fetchData(1, size, filters); // Reset to page 1 when page size changes
                },
              }}
              className="shadow-sm"
              rowClassName="hover:bg-blue-50 transition-colors duration-200"
              size={windowWidth < 768 ? "small" : "middle"}
              scroll={{ x: 1500 }}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CustomTable;
