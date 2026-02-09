'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
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
import { Camera, History, Scan } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formSchema = z.object({
  qrContent: z.string().min(1, 'QR code content cannot be empty.'),
});

const QrScanner = dynamic(
  () => import('@/components/qr-scanner').then((mod) => mod.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full rounded-md" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    ),
  }
);

export default function Home() {
  const { toast } = useToast();
  const [scanHistory, setScanHistory] = React.useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [latestAnalysis, setLatestAnalysis] =
    React.useState<AnalysisResult | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qrContent: '',
    },
  });

  const onSubmit = React.useCallback(
    async (values: z.infer<typeof formSchema>) => {
      setIsLoading(true);
      try {
        const result = await analyzeAction(values.qrContent);
        if (result) {
          setScanHistory((prevHistory) =>
            [result, ...prevHistory].slice(0, 10)
          );
          setLatestAnalysis(result);
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
    },
    [toast]
  );

  const handleScanSuccess = React.useCallback(
    async (decodedText: string) => {
      setIsScanning(false);
      form.setValue('qrContent', decodedText);
      await onSubmit({ qrContent: decodedText });
    },
    [form, onSubmit]
  );

  const handleScanCancel = React.useCallback(() => {
    setIsScanning(false);
  }, []);

  if (isScanning) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground flex items-center justify-center gap-3">
              <Camera className="w-10 h-10 text-primary" />
              Scan QR Code
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Point your camera at a QR code.
            </p>
          </div>
          <QrScanner
            onScanSuccess={handleScanSuccess}
            onCancel={handleScanCancel}
          />
        </div>
      </main>
    );
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
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                className="flex-1 text-lg"
                disabled={isLoading}
              >
                <Scan className="mr-2 h-5 w-5" />
                Analyze
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 text-lg"
                onClick={() => setIsScanning(true)}
                disabled={isLoading}
              >
                <Camera className="mr-2 h-5 w-5" />
                Scan with Camera
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-8">
          {isLoading && (
            <AnalysisResultDisplay result={null} isLoading={true} />
          )}
        </div>

        {latestAnalysis && (
          <AlertDialog
            open={!!latestAnalysis}
            onOpenChange={(isOpen) => !isOpen && setLatestAnalysis(null)}
          >
            <AlertDialogContent className="max-w-xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Analysis Complete</AlertDialogTitle>
                <AlertDialogDescription>
                  Here is a summary of the QR code content.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AnalysisResultDisplay result={latestAnalysis} isLoading={false} />
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
                {latestAnalysis.type === 'Website' &&
                  latestAnalysis.qrContent.startsWith('http') && (
                    <AlertDialogAction asChild>
                      <a
                        href={latestAnalysis.qrContent}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit Website
                      </a>
                    </AlertDialogAction>
                  )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {scanHistory.length > 0 && (
          <div className="mt-8 w-full">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
              <History className="w-6 h-6" />
              Scan History
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {scanHistory.map((item, index) => (
                <AccordionItem
                  value={`item-${index}`}
                  key={`${item.qrContent}-${index}`}
                >
                  <AccordionTrigger>
                    <span className="truncate">
                      {item.type}: {item.rootDomain || item.qrContent}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <AnalysisResultDisplay result={item} isLoading={false} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </main>
  );
}
