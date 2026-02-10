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
  Sparkles,
  FileUp,
  Globe,
  Cog,
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

const formSchema = z.object({
  qrContent: z.string().min(1, 'QR code content cannot be empty.'),
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
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] = React.useState(false);
  const [theme, setTheme] = React.useState('light');

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

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
          <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <QrCode className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">
                ScanWise
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <p className="hidden text-sm text-muted-foreground md:block">
                A Neutral QR Code Interpretation Engine
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                    <Cog className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md shadow-2xl shadow-black/20 backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                      Manage app settings and view information.
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="appearance" className="w-full pt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="appearance">Appearance</TabsTrigger>
                      <TabsTrigger value="about">About</TabsTrigger>
                    </TabsList>
                    <TabsContent value="appearance" className="pt-4">
                      <div className="grid gap-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <Label htmlFor="dark-mode" className="text-foreground">Dark Mode</Label>
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
                              A neutral QR code interpretation engine designed for transparency and security. Scan with confidence.
                          </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="container mx-auto grid max-w-7xl grid-cols-1 items-start gap-4 px-4 pt-24 pb-8 lg:grid-cols-3 lg:gap-8">
          <div className="w-full lg:sticky lg:top-24 lg:col-span-1">
            <Card className="shadow-2xl shadow-black/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <QrCode className="h-6 w-6"/>
                    Analyze a QR Code
                </CardTitle>
                <CardDescription>Scan, upload, or paste content to analyze it.</CardDescription>
              </CardHeader>
              <CardContent>
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
                          <span className="text-sm text-muted-foreground">OR</span>
                          <div className="flex-grow border-t"></div>
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
                  <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
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
        <AlertDialogContent className="shadow-2xl shadow-black/20 backdrop-blur-xl">
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
          <AlertDialogContent className="max-w-xl shadow-2xl shadow-black/20 backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl">Analysis Result</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="my-4">
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
