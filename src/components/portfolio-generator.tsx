"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState, useTransition, useRef } from "react";
import Image from "next/image";
import {
  FileText,
  Globe,
  PlusCircle,
  Share2,
  Sparkles,
  UploadCloud,
  X,
  Loader2,
  Lightbulb,
} from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { suggestLayout, SuggestLayoutOutput } from "@/ai/flows/suggest-layout";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { storage } from "@/lib/firebase";

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description is too short."),
  client: z.string().optional(),
  location: z.string().optional(),
  year: z.coerce.number().optional(),
  area: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface PortfolioData extends ProjectFormData {
  images: { url: string; uploadProgress: number | null }[];
  layout: SuggestLayoutOutput | null;
}

export default function PortfolioGenerator() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [portfolio, setPortfolio] = useState<PortfolioData>({
    title: "",
    description: "",
    images: [],
    layout: null,
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      client: "",
      location: "",
      year: new Date().getFullYear(),
      area: "",
    },
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files).map((file) => ({
      file,
      id: uuidv4(),
    }));

    newImages.forEach(async (imageData) => {
      const storageRef = ref(storage, `images/${imageData.id}-${imageData.file.name}`);

      try {
        setPortfolio((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            { url: URL.createObjectURL(imageData.file), uploadProgress: 0 },
          ],
        }));

        await uploadBytes(storageRef, imageData.file);
        const downloadURL = await getDownloadURL(storageRef);

        setPortfolio((prev) => ({
          ...prev,
          images: prev.images.map((img) =>
            img.url.startsWith("blob:") ? { url: downloadURL, uploadProgress: 100 } : img
          ),
        }));

      } catch (error) {
        console.error("Upload failed", error);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "Could not upload image.",
        });
        // Remove the failed placeholder
        setPortfolio((prev) => ({
          ...prev,
          images: prev.images.filter((img) => !img.url.startsWith("blob:")),
        }));
      }
    });
  };

  const handleRemoveImage = (index: number) => {
    setPortfolio((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const onSubmit = (data: ProjectFormData) => {
    startTransition(async () => {
      setPortfolio((prev) => ({ ...prev, ...data, layout: null }));
       if (portfolio.images.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Images',
          description: 'Please upload at least one image to generate a portfolio.',
        });
        return;
      }

      const projectDetails = `
        Project Title: ${data.title}
        Description: ${data.description}
        Client: ${data.client || 'N/A'}
        Location: ${data.location || 'N/A'}
        Year: ${data.year || 'N/A'}
        Area: ${data.area || 'N/A'}
      `;

      try {
        const result = await suggestLayout({
          projectDetails,
          imageUrls: portfolio.images.map(img => img.url),
        });
        setPortfolio((prev) => ({ ...prev, layout: result }));
        toast({
          title: "Layout Generated!",
          description: "The AI has suggested a new layout for your portfolio.",
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "An error occurred.",
          description: "Failed to generate portfolio layout.",
        });
      }
    });
  };
  
  const handleExportPdf = () => {
    toast({ title: "Printing...", description: "Your portfolio is being prepared for printing." });
    setTimeout(() => window.print(), 500);
  }

  const generatedContent = form.watch("title") || portfolio.title;

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* CONTROLS */}
        <div className="lg:h-screen lg:overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          <header>
            <Logo />
            <p className="text-muted-foreground mt-2">
              Create stunning architectural portfolios with the power of AI.
            </p>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    Enter the information about your project.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Modern Lake House" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A brief but compelling description of the project..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., The Johnson Family" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Aspen, Colorado" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year Completed</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 2023" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Area</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 4,500 sqft" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Images</CardTitle>
                  <CardDescription>
                    Upload your project visuals. Drag and drop to reorder.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {portfolio.images.map(({ url, uploadProgress }, index) => (
                      <div key={index} className="relative group aspect-[3/4]">
                        <Image
                          src={url}
                          alt={`Project image ${index + 1}`}
                          fill
                          className="object-cover rounded-lg"
                          data-ai-hint="architecture interior"
                        />
                         {uploadProgress !== null && uploadProgress < 100 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <UploadCloud className="h-8 w-8" />
                      <span className="mt-2 text-sm">Upload</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e.target.files)}
                      />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                Generate Portfolio
              </Button>
            </form>
          </Form>
        </div>

        {/* PREVIEW */}
        <div className="lg:h-screen lg:overflow-y-auto bg-muted/30 p-4 sm:p-6 md:p-8 print:p-0" id="portfolio-preview">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-muted/30 py-2 z-10 print:hidden">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Preview
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Link Copied!", description: "A shareable link has been copied to your clipboard."})}>
                <Share2 className="mr-2" /> Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportPdf}>
                    <FileText className="mr-2" />
                    Export to PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Globe className="mr-2" />
                    Export to Website (soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto bg-card p-8 sm:p-12 shadow-lg rounded-lg">
            {!generatedContent && !isPending && (
              <div className="text-center py-24">
                <h3 className="font-headline text-2xl text-muted-foreground">Your portfolio will appear here</h3>
                <p className="text-muted-foreground mt-2">Fill in the details and generate your design.</p>
              </div>
            )}
            
            {(isPending || generatedContent) && (
              <div className="space-y-12">
                <header className="text-center">
                  {isPending && !generatedContent ? <Skeleton className="h-12 w-3/4 mx-auto" /> : <h1 className="font-headline text-5xl font-bold">{portfolio.title}</h1> }
                  {isPending && !generatedContent ? <Skeleton className="h-6 w-1/2 mx-auto mt-4" /> : <p className="text-muted-foreground text-lg mt-2">{portfolio.description}</p>}
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    {isPending && !portfolio.client ? <Skeleton className="h-6 w-24 mx-auto mt-1" /> : <p className="font-semibold">{portfolio.client || 'N/A'}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    {isPending && !portfolio.location ? <Skeleton className="h-6 w-24 mx-auto mt-1" /> : <p className="font-semibold">{portfolio.location || 'N/A'}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    {isPending && !portfolio.year ? <Skeleton className="h-6 w-24 mx-auto mt-1" /> : <p className="font-semibold">{portfolio.year || 'N/A'}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Area</p>
                    {isPending && !portfolio.area ? <Skeleton className="h-6 w-24 mx-auto mt-1" /> : <p className="font-semibold">{portfolio.area || 'N/A'}</p>}
                  </div>
                </div>

                {/* DYNAMIC LAYOUT AREA */}
                {portfolio.layout?.layout ? (
                   <div className={`grid grid-cols-${portfolio.layout.layout.gridCols} gap-4`}>
                    {portfolio.layout.layout.components.map((component, index) => {
                      const { gridPosition, type, content } = component;
                      const style = {
                        gridColumn: `span ${gridPosition.colSpan}`,
                        gridRow: `span ${gridPosition.rowSpan}`,
                      };

                      if (type === 'image' && 'imageIndex' in content) {
                        const image = portfolio.images[content.imageIndex];
                        return (
                          <div key={index} className="relative aspect-[4/3]" style={style}>
                            {image ? (
                               <Image
                                src={image.url}
                                alt={`Portfolio image ${content.imageIndex + 1}`}
                                fill
                                className="object-cover rounded-md"
                                data-ai-hint="architectural design"
                              />
                            ) : <Skeleton className="h-full w-full" />}
                          </div>
                        );
                      }

                      if (type === 'text' && 'title' in content) {
                        return (
                          <div key={index} style={style} className="p-4 flex flex-col justify-center">
                            <h4 className="font-headline text-xl font-bold mb-2">{content.title}</h4>
                            <p className="text-muted-foreground text-sm">{content.content}</p>
                          </div>
                        );
                      }
                      
                      return <div key={index} style={style}><Skeleton className="h-full w-full" /></div>;
                    })}
                   </div>
                ) : isPending ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(portfolio.images.length || 4)].map((_, index) => (
                      <div key={index} className={`relative aspect-[4/3] ${index === 0 || index === 3 ? 'col-span-2' : 'col-span-1'}`}>
                        <Skeleton className="h-full w-full" />
                      </div>
                    ))}
                  </div>
                ) : null }

                
                {isPending || portfolio.layout ? (
                  <Card className="bg-accent/30 border-accent/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="text-accent-foreground" />
                        AI Layout Suggestion
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-accent-foreground/80 space-y-2">
                      {isPending && !portfolio.layout ? (
                          <>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </>
                        ) : (
                          <p>{portfolio.layout?.layoutDescription}</p>
                        )}
                    </CardContent>
                  </Card>
                ): null}
              </div>
            )}
          </div>
        </div>
      </div>
       <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #portfolio-preview, #portfolio-preview * {
            visibility: visible;
          }
          #portfolio-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
