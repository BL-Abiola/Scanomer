'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageIcon, Sparkles, Wand2, Info, Settings2 } from 'lucide-react';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { generateImageAction } from '@/app/actions';
import { Card, CardContent } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Label } from './ui/label';

const formSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters long.'),
});

export function ImageGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);
  const [apiKey, setApiKey] = React.useState('');

  React.useEffect(() => {
    const storedApiKey = localStorage.getItem('google-ai-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem('google-ai-api-key', newKey);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!apiKey) {
      toast({
        variant: 'destructive',
        title: 'API Key Required',
        description: 'Please provide your Google AI API key in the settings below.',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedImage(null);
    try {
      const result = await generateImageAction(values.prompt, apiKey);
      setGeneratedImage(result.imageDataUri);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Error',
        description: error?.message || 'Could not generate image. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Image Prompt</FormLabel>
                <FormControl>
                  <Input placeholder="A QR code made of neon lights..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Generate Image
              </>
            )}
          </Button>
        </form>
      </Form>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="api-key">
          <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                API Key Settings
              </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Google AI API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your API key"
              />
            </div>
             <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Your API key is stored only in your browser and is required for image generation. You can get a key from Google AI Studio.</span>
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-6">
        {isLoading && (
            <div className="aspect-square w-full">
                <Skeleton className="h-full w-full rounded-lg" />
            </div>
        )}
        {!isLoading && generatedImage && (
            <Card>
                <CardContent className="p-2">
                    <Image
                        src={generatedImage}
                        alt="Generated image"
                        width={512}
                        height={512}
                        className="rounded-md object-cover aspect-square w-full"
                    />
                </CardContent>
            </Card>
        )}
        {!isLoading && !generatedImage && (
          <div className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Your image will appear here
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Enter a prompt and click generate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
