import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/app/firebase/firebase-config";
import { ProjectCategory } from "@/app/types/projects/types";

interface CategoriesListProps {
  onEdit: (categoryId: string) => void;
  onNew: () => void;
}

export default function CategoriesList({ onEdit, onNew }: CategoriesListProps) {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);

        const categoriesRef = collection(db, "projectCategories");
        // Optional: Add ordering if needed
        const categoriesQuery = query(categoriesRef);
        const snapshot = await getDocs(categoriesQuery);

        const fetchedCategories: ProjectCategory[] = [];
        snapshot.forEach((doc) => {
          fetchedCategories.push({
            id: doc.id,
            ...doc.data(),
          } as ProjectCategory);
        });

        setCategories(fetchedCategories);
        setError(null);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <div className="py-4 text-center">Loading categories...</div>;
  }

  if (error) {
    return (
      <div className="py-4 text-center text-red-500">
        {error}
        <Button
          className="ml-2"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          onClick={onNew}
          className="flex items-center gap-1"
          style={{ backgroundColor: "#004aad" }}
        >
          <PlusCircle size={16} />
          <span>New Category</span>
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-md">
          <p className="text-slate-500">No categories found</p>
          <Button
            onClick={onNew}
            variant="link"
            className="mt-2"
            style={{ color: "#004aad" }}
          >
            Create your first category
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.title}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(category.id)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
