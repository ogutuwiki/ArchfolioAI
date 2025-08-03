'use server';
/**
 * @fileOverview A map generation AI agent.
 *
 * - generateMap - A function that handles the map generation process.
 * - GenerateMapInput - The input type for the generateMap function.
 * - GenerateMapOutput - The return type for the generateMap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMapInputSchema = z.object({
  location: z.string().describe('The location to generate a map for.'),
});
export type GenerateMapInput = z.infer<typeof GenerateMapInputSchema>;

const GenerateMapOutputSchema = z.object({
    mapDataUri: z.string().describe("A minimalist, abstract map of the location, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateMapOutput = z.infer<typeof GenerateMapOutputSchema>;

export async function generateMap(input: GenerateMapInput): Promise<GenerateMapOutput> {
  return generateMapFlow(input);
}

const generateMapFlow = ai.defineFlow(
  {
    name: 'generateMapFlow',
    inputSchema: GenerateMapInputSchema,
    outputSchema: GenerateMapOutputSchema,
  },
  async ({location}) => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: `Create a minimalist, abstract, black and white map for the location: ${location}. The map should be a high-contrast, stylized representation, suitable for an architectural portfolio. Do not include any text or labels. Focus on major roads and geographical features.`,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

    if (!media.url) {
      throw new Error('Failed to generate map image.');
    }

    return { mapDataUri: media.url };
  }
);
