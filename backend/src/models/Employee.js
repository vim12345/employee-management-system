const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const employeeSchema = new Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: true,
      match: [/^[0-9+\-\s()]{7,15}$/, 'Invalid phone number'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    department: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    role: {
      type: String,
      enum: ['Super Admin', 'HR Manager', 'Employee'],
      default: 'Employee',
    },
    reportingManager: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
    profileImage: { type: String, default: '' },
    isDeleted: { type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

employeeSchema.index({ name: 'text', email: 'text' });

employeeSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

employeeSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

employeeSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.isDeleted;
  return obj;
};

module.exports = mongoose.model('Employee', employeeSchema);
