// Implemented Genkit flow for suggesting portfolio layouts based on uploaded images and project details.

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

const SuggestLayoutOutputSchema = z.object({
  layoutDescription: z.string().describe('A detailed description of the suggested layout for the portfolio, including the arrangement of images and text.'),
  textBoxes: z.array(TextBoxSchema).describe('A list of text boxes with placeholder content to be placed on the portfolio layout for things like sections and elevations.'),
});
export type SuggestLayoutOutput = z.infer<typeof SuggestLayoutOutputSchema>;

export async function suggestLayout(input: SuggestLayoutInput): Promise<SuggestLayoutOutput> {
  return suggestLayoutFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLayoutPrompt',
  input: {schema: SuggestLayoutInputSchema},
  output: {schema: SuggestLayoutOutputSchema},
  prompt: `You are an expert portfolio designer specializing in architecture and interior design.

You will use the project details and images to suggest an optimal portfolio layout.

Consider the following when suggesting the layout:

- The arrangement of images to showcase the project effectively.
- The placement of text to provide context and information.
- The overall visual appeal of the portfolio.
- Suggest 2-3 text boxes for important information like "Floor Plan Details" or "Materials Palette". These text boxes should contain placeholder 'lorem ipsum' text.

Project Details: {{{projectDetails}}}
Image URLs: {{#each imageUrls}}{{{this}}} {{/each}}

Suggest a layout, including a description and an array of text boxes with titles and lorem ipsum content.
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
