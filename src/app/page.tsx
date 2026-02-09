'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  QrCode,
  Camera,
  History,
  ScanLine,
  ChevronRight,
  Globe,
  CreditCard,
  Wifi,
  Contact,
  Mail,
  Phone,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { AnalysisResult, QrType } from '@/lib/types';
import { analyzeAction } from '@/app/actions';
import { AnalysisResultDisplay } from '@/components/analysis-result';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  qrContent: z.string().min(1, 'QR code content cannot be empty.'),
});

const QrScanner = dynamic(
  () => import('@/components/qr-scanner').then((mod) => mod.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    ),
  }
);

export default function Home() {
  const { toast } = useToast();
  const [scanHistory, setScanHistory] = React.useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [activeAnalysis, setActiveAnalysis] =
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
      setActiveAnalysis(null);
      try {
        const result = await analyzeAction(values.qrContent);
        if (result) {
          setScanHistory((prevHistory) =>
            [result, ...prevHistory].slice(0, 20)
          );
          setActiveAnalysis(result);
          form.reset();
        } else {
          throw new Error('Analysis failed to return a result.');
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Analysis Error',
          description:
            'An unexpected error occurred. Please check the content and try again.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, form]
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

  const handleHistoryItemClick = (item: AnalysisResult) => {
    setActiveAnalysis(item);
  };
  
  if (isScanning) {
    return (
      <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <header className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Camera className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Scan QR Code</h1>
            <p className="mt-2 text-muted-foreground">
              Center the QR code within the frame to scan it.
            </p>
          </header>
          <QrScanner
            onScanSuccess={handleScanSuccess}
            onCancel={handleScanCancel}
          />
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full bg-muted/30">
        <main className="container mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 px-4 py-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <header className="mb-8 flex items-center gap-4">
                <QrCode className="h-10 w-10 rounded-lg bg-primary p-2 text-primary-foreground" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  ScanWise
                </h1>
                <p className="mt-1 text-muted-foreground">
                  A Neutral QR Code Interpretation Engine
                </p>
              </div>
            </header>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="qrContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            QR Code Content
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste raw QR code text here, or use the camera to scan."
                              className="min-h-[120px] resize-none rounded-md border-input bg-background text-base focus:border-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-start">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <ScanLine className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <ScanLine className="mr-2 h-5 w-5" />
                            Analyze Content
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => setIsScanning(true)}
                        disabled={isLoading}
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        Scan with Camera
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:col-span-1">
            <Card className="h-full shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <History className="h-6 w-6" />
                  <span className="text-xl font-semibold">Scan History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && scanHistory.length === 0 ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                ) : scanHistory.length > 0 ? (
                  <ScrollArea className="h-[calc(100vh-200px)] pr-3">
                    <div className="space-y-3">
                      {scanHistory.map((item, index) => (
                        <HistoryItem
                          key={`${item.qrContent}-${index}`}
                          item={item}
                          onClick={() => handleHistoryItemClick(item)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-8 text-center">
                    <History className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">
                      No Scans Yet
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your recent scans will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>

      {activeAnalysis && (
        <AlertDialog
          open={!!activeAnalysis}
          onOpenChange={(isOpen) => {
            if (!isOpen) setActiveAnalysis(null);
          }}
        >
          <AlertDialogContent className="max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Analysis Result</AlertDialogTitle>
              <AlertDialogDescription>
                Here is the analysis of the QR code content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
              <AnalysisResultDisplay result={activeAnalysis} isLoading={false} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              {activeAnalysis.type === 'Website' &&
                activeAnalysis.qrContent.startsWith('http') && (
                  <AlertDialogAction asChild>
                    <a
                      href={activeAnalysis.qrContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Visit Website
                    </a>
                  </AlertDialogAction>
                )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

const HistoryItem = ({ item, onClick }: { item: AnalysisResult; onClick: () => void }) => {
  const Icon = getTypeIcon(item.type);
  const colorClasses = getSignalColorClasses(item.signal);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg border bg-card p-3 text-left transition-all hover:bg-accent hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${colorClasses.bg} ${colorClasses.text}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-card-foreground">
              {item.rootDomain || item.type}
            </p>
            <p className="text-sm text-muted-foreground">{item.type}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
      </div>
    </button>
  );
};


const getTypeIcon = (type: QrType) => {
  const iconMap: Record<QrType, React.ElementType> = {
    Website: Globe,
    Payment: CreditCard,
    'Wi-Fi': Wifi,
    Contact: Contact,
    Email: Mail,
    Phone: Phone,
    'App Download': Download,
    File: FileText,
    Unknown: AlertCircle,
  };
  return iconMap[type] || AlertCircle;
};

const getSignalColorClasses = (signal: AnalysisResult['signal']) => {
  switch (signal) {
    case 'EMERALD': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
    case 'INDIGO': return { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' };
    case 'AMBER': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
    case 'AMETHYST': return { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' };
    case 'CRIMSON': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400' };
    default: return { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-600 dark:text-gray-400' };
  }
};
