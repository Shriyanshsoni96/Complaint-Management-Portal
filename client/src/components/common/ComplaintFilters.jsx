import { useEffect, useState } from 'react';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import * as departmentService from '../../services/departmentService.js';
import * as categoryService from '../../services/categoryService.js';

const STATUS_OPTIONS = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Emergency'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'priority', label: 'Priority (highest first)' },
  { value: 'status', label: 'Status (lifecycle order)' },
];

export const emptyComplaintFilters = {
  search: '',
  status: '',
  priority: '',
  department: '',
  category: '',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
};

function ComplaintFilters({ onChange, showDepartment = false, showCategory = false }) {
  const [filters, setFilters] = useState(emptyComplaintFilters);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!showDepartment && !showCategory) return;
    departmentService
      .getDepartments()
      .then((result) => setDepartments(result.data.departments))
      .catch(() => {});
  }, [showDepartment, showCategory]);

  useEffect(() => {
    if (!showCategory) {
      return undefined;
    }

    let cancelled = false;
    categoryService
      .getCategories(filters.department ? { department: filters.department } : {})
      .then((result) => {
        if (!cancelled) setCategories(result.data.categories);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [showCategory, filters.department]);

  // Debounced so typing in search (or flipping through selects) feels instant
  // without firing a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => onChange(filters), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { category: '' } : {}),
    }));
  };

  const handleReset = () => {
    setFilters(emptyComplaintFilters);
  };

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="min-w-[200px] flex-1">
        <Input
          id="search"
          name="search"
          label="Search"
          placeholder="Title or tracking ID"
          value={filters.search}
          onChange={handleChange}
        />
      </div>

      <Select id="status" name="status" label="Status" value={filters.status} onChange={handleChange}>
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </Select>

      <Select
        id="priority"
        name="priority"
        label="Priority"
        value={filters.priority}
        onChange={handleChange}
      >
        <option value="">All priorities</option>
        {PRIORITY_OPTIONS.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </Select>

      {showDepartment && (
        <Select
          id="department"
          name="department"
          label="Department"
          value={filters.department}
          onChange={handleChange}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department._id} value={department._id}>
              {department.departmentName}
            </option>
          ))}
        </Select>
      )}

      {showCategory && (
        <Select
          id="category"
          name="category"
          label="Category"
          value={filters.category}
          onChange={handleChange}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.categoryName}
            </option>
          ))}
        </Select>
      )}

      <Input
        id="dateFrom"
        name="dateFrom"
        type="date"
        label="From"
        value={filters.dateFrom}
        onChange={handleChange}
      />
      <Input id="dateTo" name="dateTo" type="date" label="To" value={filters.dateTo} onChange={handleChange} />

      <Select id="sort" name="sort" label="Sort by" value={filters.sort} onChange={handleChange}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Button type="button" variant="secondary" onClick={handleReset}>
        Reset
      </Button>
    </div>
  );
}

export default ComplaintFilters;
