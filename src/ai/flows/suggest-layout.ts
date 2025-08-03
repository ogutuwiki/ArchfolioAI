'use server';

/**
 * @fileOverview A portfolio layout suggestion AI agent.
 *
 * - suggestLayout - A function that handles the portfolio layout suggestion process.
 * - SuggestLayoutInput - The input type for the suggestLayout function.
 * - SuggestLayoutOutput - The return type for the suggestLayout function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLayoutInputSchema = z.object({
  projectDetails: z.string().describe('The details of the project including description, square footage, and budget.'),
  imageUrls: z.array(z.string()).describe('The URLs of the images uploaded for the project.'),
});
export type SuggestLayoutInput = z.infer<typeof SuggestLayoutInputSchema>;

const TextBoxSchema = z.object({
  title: z.string().describe('A short title for the text box (e.g., "Section", "Elevation").'),
  content: z.string().describe("Placeholder lorem ipsum text for the text box."),
});

const LayoutComponentSchema = z.object({
  type: z.enum(["image", "text"]),
  gridPosition: z.object({
    colSpan: z.number().describe("Column span of the component."),
    rowSpan: z.number().describe("Row span of the component."),
  }),
  content: z.union([
    z.object({ imageIndex: z.number().describe("Index of the image from the provided list.") }),
    TextBoxSchema,
  ]),
});


const SuggestLayoutOutputSchema = z.object({
  layoutDescription: z.string().describe('A detailed description of the suggested layout for the portfolio, including the arrangement of images and text.'),
  layout: z.object({
    gridCols: z.number().min(1).max(12).describe("Number of columns in the grid (e.g., 4)."),
    components: z.array(LayoutComponentSchema).describe("An array of components (images or text boxes) to be placed in the layout."),
  }),
});
export type SuggestLayoutOutput = z.infer<typeof SuggestLayoutOutputSchema>;

export async function suggestLayout(input: SuggestLayoutInput): Promise<SuggestLayoutOutput> {
  return suggestLayoutFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLayoutPrompt',
  input: {schema: SuggestLayoutInputSchema},
  output: {schema: SuggestLayoutOutputSchema},
  prompt: `You are an expert portfolio designer specializing in modern, minimalist architecture and interior design portfolios. Your goal is to create visually stunning and professional layouts based on the provided project details and images.

You will receive project details and a list of image URLs. You need to design a grid-based layout for these assets. The total number of images available is ${"{{imageUrls.length}}"}.

Follow these rules:
1.  **Grid System**: Define a grid system by specifying the number of columns (gridCols). Use between 2 and 6 columns.
2.  **Component Placement**: For each image and text box, define its position on the grid using 'colSpan' and 'rowSpan'. The total column span in a row should not exceed 'gridCols'.
3.  **Image Mapping**: When placing an image, use the 'imageIndex' to refer to an image from the provided list. Use all available images.
4.  **Text Boxes**: Strategically place 2-3 text boxes to complement the images. These can be for project descriptions, details, or other annotations. The content should be placeholder 'lorem ipsum' text.
5.  **Variety**: Create dynamic and interesting layouts. Avoid simple, monotonous grids. Mix large hero images with smaller accent images. Juxtapose images with text. Refer to the provided examples for inspiration on creating professional, clean, and minimalist layouts.
6.  **Description**: Provide a brief 'layoutDescription' explaining your design choices.

Project Details: {{{projectDetails}}}
Image URLs: {{#each imageUrls}}{{{this}}} {{/each}}

Generate a layout configuration that includes the grid column count and an array of components.
`,
});

const suggestLayoutFlow = ai.defineFlow(
  {
    name: 'suggestLayoutFlow',
    inputSchema: SuggestLayoutInputSchema,
    outputSchema: SuggestLayoutOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
