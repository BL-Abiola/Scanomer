'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { AnalysisResult } from '@/lib/types';
import { analyzeAction } from '@/app/actions';
import { AnalysisResultDisplay } from '@/components/analysis-result';
import { Scan } from 'lucide-react';

const formSchema = z.object({
  qrContent: z.string().min(1, 'QR code content cannot be empty.'),
});

export default function Home() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] =
    React.useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qrContent: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeAction(values.qrContent);
      if (result) {
        setAnalysisResult(result);
      } else {
        throw new Error('Analysis failed to return a result.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description:
          'An unexpected error occurred during analysis. Please check the content and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground flex items-center justify-center gap-3">
            <Scan className="w-10 h-10 text-primary" />
            ScanWise
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            A Neutral QR Code Interpretation Engine
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="qrContent"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Paste the raw text content from a QR code here..."
                      className="resize-none min-h-[120px] text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full text-lg"
              disabled={isLoading}
            >
              Analyze
            </Button>
          </form>
        </Form>

        <div className="mt-8">
          {(isLoading || analysisResult) && (
            <AnalysisResultDisplay
              result={analysisResult}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </main>
  );
}
