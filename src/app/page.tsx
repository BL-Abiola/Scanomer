'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import {
  QrCode,
  Camera,
  History,
  Sparkles,
  FileUp,
  Globe,
  Cog,
  Palette,
  Info,
  Download,
} from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import type { AnalysisResult } from '@/lib/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { HistoryItem } from '@/components/history-item';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const formSchema = z.object({
  qrContent: z.string().min(1, 'QR code content cannot be empty.'),
});

const qrGenerationFormSchema = z.object({
  prompt: z.string().min(1, 'Content cannot be empty.'),
});

const QrScanner = dynamic(
  () => import('@/components/qr-scanner').then((mod) => mod.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-2xl mx-auto space-y-4">
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
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] =
    React.useState(false);
  const [theme, setTheme] = React.useState('light');
  const [generatedQrCode, setGeneratedQrCode] = React.useState<string | null>(
    null
  );
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  // On mount, load settings from local storage
  React.useEffect(() => {
    const storedTheme = localStorage.getItem('scanwise-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
    }
  }, []);

  // Update DOM and save to local storage when theme changes
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('scanwise-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const analyzeForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      qrContent: '',
    },
  });

  const generationForm = useForm<z.infer<typeof qrGenerationFormSchema>>({
    resolver: zodResolver(qrGenerationFormSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const onAnalyzeSubmit = React.useCallback(
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
          analyzeForm.reset();
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
    [toast, analyzeForm]
  );

  const onGenerateQrSubmit = React.useCallback(
    async (values: z.infer<typeof qrGenerationFormSchema>) => {
      setIsGenerating(true);
      setGeneratedQrCode(null);
      try {
        const qrCodeUrl = await QRCode.toDataURL(values.prompt, {
          width: 512,
          margin: 2,
          errorCorrectionLevel: 'H'
        });
        setGeneratedQrCode(qrCodeUrl);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'QR Generation Error',
          description: 'Could not generate QR code.',
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [toast]
  );

  const handleDownloadQr = React.useCallback(() => {
    if (!generatedQrCode) return;
    const link = document.createElement('a');
    link.href = generatedQrCode;
    link.download = 'scanwise-qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedQrCode]);

  const handleScanSuccess = React.useCallback(
    async (decodedText: string) => {
      setIsScanning(false);
      analyzeForm.setValue('qrContent', decodedText);
      await onAnalyzeSubmit({ qrContent: decodedText });
    },
    [analyzeForm, onAnalyzeSubmit]
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || !event.target.files.length) return;
    const file = event.target.files[0];
    if (!file) return;

    const fileScannerElement = document.createElement('div');
    fileScannerElement.id = 'file-scanner';
    fileScannerElement.style.display = 'none';
    document.body.appendChild(fileScannerElement);

    const html5QrCode = new Html5Qrcode('file-scanner');

    setIsLoading(true);
    setActiveAnalysis(null);

    try {
      const decodedText = await html5QrCode.scanFile(file, false);
      analyzeForm.setValue('qrContent', decodedText);
      await onAnalyzeSubmit({ qrContent: decodedText });
    } catch (err) {
      console.error('Error scanning file:', err);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'No QR code found in the image.',
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
        <div className="w-full max-w-md space-y-4">
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
        <header className="fixed top-0 left-0 right-0 z-20 border-b bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <QrCode className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">ScanWise</h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="hidden text-sm text-muted-foreground md:block">
                A Neutral QR Code Interpretation Engine
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                  >
                    <Cog className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-lg shadow-2xl shadow-black/20 backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                      Manage app settings and view information.
                    </DialogDescription>
                  </DialogHeader>
                  <TooltipProvider>
                    <Tabs defaultValue="appearance" className="w-full pt-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TabsTrigger value="appearance">
                              <Palette className="h-5 w-5" />
                              <span className="sr-only">Appearance</span>
                            </TabsTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Appearance</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <TabsTrigger value="about">
                              <Info className="h-5 w-5" />
                              <span className="sr-only">About</span>
                            </TabsTrigger>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>About</p>
                          </TooltipContent>
                        </Tooltip>
                      </TabsList>
                      <TabsContent value="appearance" className="pt-4">
                        <div className="grid gap-4">
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label
                              htmlFor="dark-mode"
                              className="text-foreground"
                            >
                              Dark Mode
                            </Label>
                            <Switch
                              id="dark-mode"
                              checked={theme === 'dark'}
                              onCheckedChange={toggleTheme}
                            />
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="about" className="pt-4">
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p className="font-semibold text-foreground">
                            ScanWise v1.0
                          </p>
                          <p>
                            A neutral QR code interpretation engine designed for
                            transparency and security. Scan with confidence.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </TooltipProvider>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="container mx-auto grid max-w-7xl grid-cols-1 items-start gap-4 pt-24 pb-8 lg:grid-cols-3 lg:gap-8">
          <div className="w-full lg:sticky lg:top-24 lg:col-span-1">
            <Card className="shadow-2xl shadow-black/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <QrCode className="h-6 w-6" />
                  Toolkit
                </CardTitle>
                <CardDescription>
                  Analyze or generate QR codes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="analyze" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="analyze">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze
                    </TabsTrigger>
                    <TabsTrigger value="generate">
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate QR
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="analyze" className="pt-6">
                    <div className="space-y-6">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => setIsSelectionDialogOpen(true)}
                        disabled={isLoading}
                        className="flex h-40 w-full flex-col items-center justify-center gap-2 text-base"
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
                        <div className="flex-grow border-t"></div>
                        <span className="text-sm text-muted-foreground">
                          OR
                        </span>
                        <div className="flex-grow border-t"></div>
                      </div>

                      <Form {...analyzeForm}>
                        <form
                          onSubmit={analyzeForm.handleSubmit(onAnalyzeSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={analyzeForm.control}
                            name="qrContent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="sr-only">
                                  QR Code Content
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Paste raw QR code content..."
                                    className="min-h-[60px] resize-none text-base"
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
                  </TabsContent>
                  <TabsContent value="generate" className="pt-6">
                    <div className="space-y-4">
                      <Form {...generationForm}>
                        <form
                          onSubmit={generationForm.handleSubmit(
                            onGenerateQrSubmit
                          )}
                          className="space-y-4"
                        >
                          <FormField
                            control={generationForm.control}
                            name="prompt"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Content to Encode</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="https://example.com, or any text..."
                                    className="resize-y"
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
                            disabled={isGenerating}
                            className="w-full"
                          >
                            {isGenerating ? (
                              <>
                                <QrCode className="mr-2 h-5 w-5 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <QrCode className="mr-2 h-5 w-5" />
                                Generate QR Code
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                      <div className="aspect-square w-full">
                        {isGenerating ? (
                          <Skeleton className="h-full w-full rounded-lg" />
                        ) : generatedQrCode ? (
                          <Image
                            src={generatedQrCode}
                            alt="Generated QR code"
                            width={512}
                            height={512}
                            className="h-full w-full rounded-lg object-contain bg-white p-4"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed">
                            <QrCode className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              Your generated QR code will appear here.
                            </p>
                          </div>
                        )}
                      </div>
                       {generatedQrCode && !isGenerating && (
                        <Button
                          onClick={handleDownloadQr}
                          className="w-full"
                          variant="secondary"
                          size="lg"
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Download QR Code
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <aside className="w-full lg:col-span-2">
            <Card className="shadow-2xl shadow-black/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <History className="h-6 w-6" />
                  <span className="text-xl font-semibold">Scan History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading && scanHistory.length === 0 ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
                ) : scanHistory.length > 0 ? (
                  <ScrollArea className="h-[60vh] lg:h-[calc(100vh-22rem)] pr-4">
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
                  <div className="flex h-[calc(100vh-22rem)] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
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

      <AlertDialog
        open={isSelectionDialogOpen}
        onOpenChange={setIsSelectionDialogOpen}
      >
        <AlertDialogContent className="rounded-lg shadow-2xl shadow-black/20 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Choose Input Method</AlertDialogTitle>
            <AlertDialogDescription>
              How would you like to provide the QR code?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2">
            <Button
              onClick={() => {
                setIsScanning(true);
                setIsSelectionDialogOpen(false);
              }}
            >
              <Camera className="mr-2 h-4 w-4" />
              Use Camera
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                handleUploadClick();
                setIsSelectionDialogOpen(false);
              }}
            >
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
          <AlertDialogContent className="max-w-md md:max-w-xl rounded-lg shadow-2xl shadow-black/20 backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl md:text-2xl">
                Analysis Result
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="my-2 md:my-4">
              <AnalysisResultDisplay result={activeAnalysis} isLoading={false} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Go Back</AlertDialogCancel>
              {activeAnalysis.type === 'Website' &&
                activeAnalysis.qrContent.startsWith('http') && (
                  <AlertDialogAction asChild>
                    <a
                      href={activeAnalysis.qrContent}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'inline-flex items-center',
                        buttonVariants({ variant: 'default' })
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
