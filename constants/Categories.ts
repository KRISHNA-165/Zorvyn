export const PREDEFINED_CATEGORIES = [
  'Housing', 
  'Food', 
  'Transport', 
  'Utilities', 
  'Insurance', 
  'Healthcare', 
  'Savings', 
  'Personal', 
  'Entertainment', 
  'Salary', 
  'Investment'
];

export type CategoryName = typeof PREDEFINED_CATEGORIES[number] | string;
