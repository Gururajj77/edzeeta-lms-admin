import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getCategoryById,
  createCategory,
  updateCategory,
} from "./services/categoryService";

interface CategoryFormProps {
  categoryId: string | null; // null means creating new
  onComplete: () => void;
}

export default function CategoryForm({
  categoryId,
  onComplete,
}: CategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Fetch category data if editing
  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) return;

      try {
        setIsLoading(true);
        const category = await getCategoryById(categoryId);

        if (category) {
          setTitle(category.title);
          setDescription(category.description);
          setImageUrl(category.imageUrl || "");
        }
      } catch (error) {
        console.error("Error fetching category:", error);
        // Handle error (show notification, etc.)
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      const categoryData = {
        title,
        description,
        imageUrl: imageUrl || null,
      };

      if (categoryId) {
        // Update existing category
        await updateCategory(categoryId, categoryData);
      } else {
        // Create new category
        await createCategory({
          ...categoryData,
        });
      }

      onComplete();
    } catch (error) {
      console.error("Error saving category:", error);
      // Handle error (show notification, etc.)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Category title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe what types of projects belong in this category"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="imageUrl">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          placeholder="URL to category image"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onComplete} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          style={{ backgroundColor: "#004aad" }}
          disabled={isLoading}
        >
          {isLoading
            ? "Saving..."
            : categoryId
            ? "Save Changes"
            : "Create Category"}
        </Button>
      </div>
    </div>
  );
}
