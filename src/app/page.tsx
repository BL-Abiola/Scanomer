'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  History,
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
  Sparkles,
  FileUp,
} from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  qrContent: z.string().min(1, 'QR code content cannot be empty.'),
});

const QrScanner = dynamic(
  () => import('@/components/qr-scanner').then((mod) => mod.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full rounded-lg" />
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] = React.useState(false);

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
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files.length) return;
    const file = event.target.files[0];
    if (!file) return;

    // A hidden element used by the html5-qrcode library
    const fileScannerElement = document.createElement('div');
    fileScannerElement.id = 'file-scanner';
    fileScannerElement.style.display = 'none';
    document.body.appendChild(fileScannerElement);
    
    const html5QrCode = new Html5Qrcode("file-scanner");
    
    setIsLoading(true);
    setActiveAnalysis(null);

    try {
        const decodedText = await html5QrCode.scanFile(file, false);
        form.setValue('qrContent', decodedText);
        await onSubmit({ qrContent: decodedText });
    } catch (err) {
        console.error("Error scanning file:", err);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "No QR code found in the image.",
        });
        setIsLoading(false);
    } finally {
        if (event.target) {
            event.target.value = '';
        }
        document.body.removeChild(fileScannerElement);
    }
  };


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
      <div className="min-h-screen w-full">
        <header className="fixed top-0 left-0 right-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex h-16 max-w-8xl items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <QrCode className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">
                ScanWise
              </h1>
            </div>
             <p className="hidden text-sm text-muted-foreground md:block">
                A Neutral QR Code Interpretation Engine
              </p>
          </div>
        </header>

        <main className="container mx-auto grid max-w-3xl grid-cols-1 gap-y-10 px-4 pt-24 pb-8">
          <div className="w-full">
            <Card className="border-white/10 bg-card/60 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Analyze QR Content</CardTitle>
                <CardDescription>Scan a QR code from your camera, upload an image, or paste the content below.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => setIsSelectionDialogOpen(true)}
                        disabled={isLoading}
                        className="flex h-40 w-full flex-col items-center justify-center gap-2 border-white/10 bg-white/5 text-base hover:bg-white/10 hover:text-foreground"
                    >
                        <Camera className="h-10 w-10" />
                        <span>Scan or Upload</span>
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />

                    <div className="flex items-center gap-4">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="text-sm text-muted-foreground">OR</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="qrContent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">
                                            QR Code Content
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Paste raw QR code content..."
                                                className="min-h-[60px] resize-none rounded-lg border-white/10 bg-white/5 text-base ring-offset-background focus-visible:ring-primary"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                size="lg"
                                disabled={isLoading}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Analyze Content
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="w-full">
            <Card className="border-white/10 bg-card/60 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <History className="h-6 w-6" />
                  <span className="text-xl font-semibold">Scan History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && scanHistory.length === 0 ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-lg bg-white/5" />
                    <Skeleton className="h-20 w-full rounded-lg bg-white/5" />
                    <Skeleton className="h-20 w-full rounded-lg bg-white/5" />
                  </div>
                ) : scanHistory.length > 0 ? (
                  <ScrollArea className="h-[400px] pr-4">
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
                  <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 bg-white/5 p-8 text-center">
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

      <AlertDialog open={isSelectionDialogOpen} onOpenChange={setIsSelectionDialogOpen}>
        <AlertDialogContent className="border-white/10 bg-card/80 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <AlertDialogHeader>
                <AlertDialogTitle>Choose Input Method</AlertDialogTitle>
                <AlertDialogDescription>
                    How would you like to provide the QR code?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
                <Button onClick={() => { setIsScanning(true); setIsSelectionDialogOpen(false); }}>
                    <Camera className="mr-2 h-4 w-4" />
                    Use Camera
                </Button>
                <Button variant="secondary" onClick={() => { handleUploadClick(); setIsSelectionDialogOpen(false); }}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload Image
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {activeAnalysis && (
        <AlertDialog
          open={!!activeAnalysis}
          onOpenChange={(isOpen) => {
            if (!isOpen) setActiveAnalysis(null);
          }}
        >
          <AlertDialogContent className="max-w-xl border-white/10 bg-card/80 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl">Analysis Result</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="my-4">
              <AnalysisResultDisplay result={activeAnalysis} isLoading={false} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-foreground">Go Back</AlertDialogCancel>
              {activeAnalysis.type === 'Website' &&
                activeAnalysis.qrContent.startsWith('http') && (
                  <AlertDialogAction asChild>
                    <a
                      href={activeAnalysis.qrContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex items-center',
                        buttonVariants({variant: 'default'})
                      )}
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
      className={cn(
        "w-full rounded-xl border-l-4 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:ring-2 hover:ring-primary/50",
        colorClasses.border
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg', colorClasses.iconBg, colorClasses.iconText)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {item.rootDomain || item.type}
            </p>
            <p className="truncate text-sm text-muted-foreground">{item.description}</p>
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
    case 'EMERALD': return { border: 'border-l-[hsl(var(--chart-1))]', iconBg: 'bg-[hsl(var(--chart-1)/0.1)]', iconText: 'text-[hsl(var(--chart-1))]' };
    case 'INDIGO': return { border: 'border-l-[hsl(var(--chart-2))]', iconBg: 'bg-[hsl(var(--chart-2)/0.1)]', iconText: 'text-[hsl(var(--chart-2))]' };
    case 'AMBER': return { border: 'border-l-[hsl(var(--chart-3))]', iconBg: 'bg-[hsl(var(--chart-3)/0.1)]', iconText: 'text-[hsl(var(--chart-3))]' };
    case 'AMETHYST': return { border: 'border-l-[hsl(var(--chart-4))]', iconBg: 'bg-[hsl(var(--chart-4)/0.1)]', iconText: 'text-[hsl(var(--chart-4))]' };
    case 'CRIMSON': return { border: 'border-l-[hsl(var(--chart-5))]', iconBg: 'bg-[hsl(var(--chart-5)/0.1)]', iconText: 'text-[hsl(var(--chart-5))]' };
    default: return { border: 'border-l-gray-500', iconBg: 'bg-gray-500/10', iconText: 'text-gray-400' };
  }
};