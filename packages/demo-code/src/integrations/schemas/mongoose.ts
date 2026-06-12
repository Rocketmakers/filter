import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const employeeSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  salary: { type: Number, required: true },
  hireDate: { type: Date, required: true },
  lastLogin: { type: Date, required: true },
  isActive: { type: Boolean, required: true },
  departmentId: { type: String, required: true },
  skillIds: { type: [String], default: [] },
  aliases: { type: [String], default: [] },
  quarterlyScores: { type: [Number], default: [] },
  performanceReviewDates: { type: [Date], default: [] },
  shiftStarts: { type: [Date], default: [] },
});

export type IEmployee = InferSchemaType<typeof employeeSchema>;

export const Employee: Model<IEmployee> =
  mongoose.models.Employee ??
  mongoose.model<IEmployee>("Employee", employeeSchema);
