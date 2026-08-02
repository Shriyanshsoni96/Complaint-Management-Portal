import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ComplaintFilters, { emptyComplaintFilters } from './ComplaintFilters.jsx';
import * as departmentService from '../../services/departmentService.js';
import * as categoryService from '../../services/categoryService.js';

vi.mock('../../services/departmentService.js', () => ({
  getDepartments: vi.fn(),
}));

vi.mock('../../services/categoryService.js', () => ({
  getCategories: vi.fn(),
}));

describe('ComplaintFilters (user flow)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    departmentService.getDepartments.mockResolvedValue({ data: { departments: [] } });
    categoryService.getCategories.mockResolvedValue({ data: { categories: [] } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search input and calls onChange ~300ms after the last keystroke', async () => {
    const onChange = vi.fn();
    render(<ComplaintFilters onChange={onChange} />);

    // Initial mount schedules one onChange call with the empty filters.
    await vi.advanceTimersByTimeAsync(300);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(emptyComplaintFilters);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'l' } });
    await vi.advanceTimersByTimeAsync(100);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'le' } });
    await vi.advanceTimersByTimeAsync(100);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'leak' } });

    // Not yet 300ms since the last keystroke - no extra call.
    await vi.advanceTimersByTimeAsync(200);
    expect(onChange).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({ ...emptyComplaintFilters, search: 'leak' });
  });

  it('resets to the default filters when Reset is clicked', async () => {
    const onChange = vi.fn();
    render(<ComplaintFilters onChange={onChange} />);
    await vi.advanceTimersByTimeAsync(300);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'leak' } });
    await vi.advanceTimersByTimeAsync(300);
    expect(onChange).toHaveBeenLastCalledWith({ ...emptyComplaintFilters, search: 'leak' });

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await vi.advanceTimersByTimeAsync(300);
    expect(onChange).toHaveBeenLastCalledWith(emptyComplaintFilters);
  });

  it('clears the selected category whenever the department changes', async () => {
    departmentService.getDepartments.mockResolvedValue({
      data: {
        departments: [
          { _id: 'dept-1', departmentName: 'Water Supply' },
          { _id: 'dept-2', departmentName: 'Roads' },
        ],
      },
    });
    categoryService.getCategories.mockResolvedValue({
      data: { categories: [{ _id: 'cat-1', categoryName: 'Pipeline Leak' }] },
    });

    const onChange = vi.fn();
    render(<ComplaintFilters onChange={onChange} showDepartment showCategory />);

    await vi.advanceTimersByTimeAsync(300);
    expect(screen.getByText('Water Supply')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'cat-1' } });
    await vi.advanceTimersByTimeAsync(300);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'cat-1' }),
    );

    fireEvent.change(screen.getByLabelText('Department'), { target: { value: 'dept-2' } });
    await vi.advanceTimersByTimeAsync(300);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ department: 'dept-2', category: '' }),
    );
  });

  it('does not fetch departments or categories when neither toggle is enabled', async () => {
    render(<ComplaintFilters onChange={vi.fn()} />);
    await vi.advanceTimersByTimeAsync(300);

    expect(departmentService.getDepartments).not.toHaveBeenCalled();
    expect(categoryService.getCategories).not.toHaveBeenCalled();
  });
});
