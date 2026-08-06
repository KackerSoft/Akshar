"use client";

import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API, type FieldErrors } from "@/lib/api";
import type { TemplateSerialized } from "@/lib/serializers/template";

export function AddTemplateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation<TemplateSerialized, FieldErrors, void>({
    mutationFn: () =>
      API.templates.create({
        name,
        description: description || undefined,
        content: "<p>Hello {{name}}!</p>",
        variables: [{ key: "name", label: "Name", defaultValue: "World" }],
      }),
    onSuccess: (template) => {
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/templates/${template.id}`);
    },
  });

  const errors: FieldErrors = createMutation.error ?? {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>New template</DialogTitle>
            <DialogDescription>
              Create a new Handlebars template. You&apos;ll edit the content
              and variables next.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g., Invoice"
              />
              {errors.name?.[0] && (
                <p className="text-sm text-destructive">{errors.name[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="template-description">Description (optional)</Label>
              <Input
                id="template-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What is this template for?"
              />
              {errors.description?.[0] && (
                <p className="text-sm text-destructive">{errors.description[0]}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
