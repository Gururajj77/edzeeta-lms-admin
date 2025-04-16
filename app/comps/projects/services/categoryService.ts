// services/categoryService.ts
import { collection, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/firebase/firebase-config";
import { ProjectCategory } from "@/app/types/projects/types";

export const getCategoryById = async (
  categoryId: string
): Promise<ProjectCategory | null> => {
  try {
    const categoryRef = doc(db, "projectCategories", categoryId);
    const categorySnap = await getDoc(categoryRef);

    if (categorySnap.exists()) {
      return { id: categorySnap.id, ...categorySnap.data() } as ProjectCategory;
    }

    return null;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw error;
  }
};

export const createCategory = async (
  categoryData: Omit<ProjectCategory, "id">
): Promise<string> => {
  try {
    const categoriesRef = collection(db, "projectCategories");
    const docRef = await addDoc(categoriesRef, categoryData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

export const updateCategory = async (
  categoryId: string,
  categoryData: Partial<ProjectCategory>
): Promise<void> => {
  try {
    const categoryRef = doc(db, "projectCategories", categoryId);
    await updateDoc(categoryRef, categoryData);
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};
