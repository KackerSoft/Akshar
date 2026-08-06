"use client";

import { useMutation } from "@tanstack/react-query";
import { Copy } from "lucide-react";
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
import type { TemplateVariable } from "@/lib/types/template";

export function DuplicateTemplateDialog({
  sourceName,
  sourceDescription,
  content,
  headerContent,
  footerContent,
  helpersScript,
  variables,
}: {
  sourceName: string;
  sourceDescription: string;
  content: string;
  headerContent: string;
  footerContent: string;
  helpersScript: string;
  variables: TemplateVariable[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const duplicateMutation = useMutation<TemplateSerialized, FieldErrors, void>({
    mutationFn: () =>
      API.templates.create({
        name,
        description: description || undefined,
        content,
        headerContent: headerContent || undefined,
        footerContent: footerContent || undefined,
        helpersScript: helpersScript || undefined,
        variables,
      }),
    onSuccess: (template) => {
      setOpen(false);
      router.push(`/templates/${template.id}`);
    },
  });

  const errors: FieldErrors = duplicateMutation.error ?? {};

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setName(`${sourceName} (copy)`);
          setDescription(sourceDescription);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Copy className="h-4 w-4" />
          Duplicate template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            duplicateMutation.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Duplicate template</DialogTitle>
            <DialogDescription>
              Creates a new template with the same content, header, footer,
              script and variables as the current editor state.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="duplicate-template-name">Template name</Label>
              <Input
                id="duplicate-template-name"
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g., Invoice (copy)"
              />
              {errors.name?.[0] && (
                <p className="text-sm text-destructive">{errors.name[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duplicate-template-description">
                Description (optional)
              </Label>
              <Input
                id="duplicate-template-description"
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
            <Button type="submit" disabled={duplicateMutation.isPending}>
              {duplicateMutation.isPending ? "Duplicating…" : "Duplicate template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
