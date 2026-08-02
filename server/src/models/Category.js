import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
  },
  { timestamps: true },
);

categorySchema.index({ department: 1, categoryName: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

export default Category;
