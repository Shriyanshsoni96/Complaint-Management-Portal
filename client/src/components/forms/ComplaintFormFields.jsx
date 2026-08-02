import Input from '../ui/Input.jsx';
import Textarea from '../ui/Textarea.jsx';
import Select from '../ui/Select.jsx';

export const PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];

function ComplaintFormFields({ form, onChange, departments, categories }) {
  return (
    <>
      <Input id="title" name="title" label="Title" required value={form.title} onChange={onChange} />
      <Textarea
        id="description"
        name="description"
        label="Description"
        required
        rows={4}
        value={form.description}
        onChange={onChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          id="department"
          name="department"
          label="Department"
          required
          value={form.department}
          onChange={onChange}
        >
          <option value="">Select department</option>
          {departments.map((department) => (
            <option key={department._id} value={department._id}>
              {department.departmentName}
            </option>
          ))}
        </Select>

        <Select
          id="category"
          name="category"
          label="Category"
          required
          disabled={!form.department}
          value={form.category}
          onChange={onChange}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.categoryName}
            </option>
          ))}
        </Select>
      </div>

      <Select
        id="priority"
        name="priority"
        label="Priority"
        required
        value={form.priority}
        onChange={onChange}
      >
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </Select>

      <Input
        id="address"
        name="address"
        label="Address"
        required
        value={form.address}
        onChange={onChange}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input id="city" name="city" label="City" required value={form.city} onChange={onChange} />
        <Input id="state" name="state" label="State" required value={form.state} onChange={onChange} />
      </div>
    </>
  );
}

export default ComplaintFormFields;
