'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  History,
  FileUp,
  Cog,
  ScanLine,
  ArrowLeft,
  X,
  Globe,
  ChevronDown,
  Zap,
  Save,
  Search,
  Trash2,
  Info,
  Mail,
  RefreshCcw,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { AnalysisResult } from '@/lib/types';
import { analyzeAction } from '@/app/actions';
import { AnalysisResultDisplay } from '@/components/analysis-result';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
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
import { HistoryItem } from '@/components/history-item';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';

const formSchema = z.object({
  qrContent: z.string().min(1, 'Content cannot be empty.'),
});

const QrScanner = dynamic(
  () => import('@/components/qr-scanner').then((mod) => mod.QrScanner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-md mx-auto space-y-4">
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
  const [activeAnalysis, setActiveAnalysis] = React.useState<AnalysisResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [theme, setTheme] = React.useState('light');
  const [apiKey, setApiKey] = React.useState('');
  const [apiKeyInput, setApiKeyInput] = React.useState('');
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Hydration safety
  React.useEffect(() => {
    setIsHydrated(true);
    
    const storedTheme = localStorage.getItem('scanomer-theme') || 'light';
    setTheme(storedTheme);
    
    const storedApiKey = localStorage.getItem('scanomer-api-key') || '';
    setApiKey(storedApiKey);
    setApiKeyInput(storedApiKey);

    const storedHistory = localStorage.getItem('scanomer-history');
    if (storedHistory) {
      try {
        setScanHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const onboarded = localStorage.getItem('scanomer-onboarded');
    if (!onboarded) {
      setShowOnboarding(true);
    }
  }, []);

  // Persist history
  React.useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('scanomer-history', JSON.stringify(scanHistory));
    }
  }, [scanHistory, isHydrated]);

  React.useEffect(() => {
    if (isHydrated) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('scanomer-theme', theme);
    }
  }, [theme, isHydrated]);

  const toggleTheme = () => setTheme((p) => (p === 'dark' ? 'light' : 'dark'));

  const handleApiKeySave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(apiKeyInput);
    localStorage.setItem('scanomer-api-key', apiKeyInput);
    toast({ title: 'Saved', description: 'Settings updated.' });
  };

  const handleReset = () => {
    localStorage.removeItem('scanomer-history');
    localStorage.removeItem('scanomer-api-key');
    localStorage.removeItem('scanomer-onboarded');
    setScanHistory([]);
    setApiKey('');
    setApiKeyInput('');
    setShowOnboarding(true);
    toast({ title: 'Reset Complete', description: 'All local data has been cleared.' });
  };

  const closeOnboarding = () => {
    localStorage.setItem('scanomer-onboarded', 'true');
    setShowOnboarding(false);
  };

  const analyzeForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { qrContent: '' },
  });

  const onAnalyzeSubmit = React.useCallback(
    async (values: z.infer<typeof formSchema>) => {
      setIsLoading(true);
      setActiveAnalysis(null);
      try {
        const result = await analyzeAction(values.qrContent, apiKey || null);
        if (result) {
          const resultWithId: AnalysisResult = {
            ...result,
            id: crypto.randomUUID(),
          };
          setScanHistory((prev) => [resultWithId, ...prev].slice(0, 20));
          setActiveAnalysis(resultWithId);
          analyzeForm.reset();
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to read content.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, analyzeForm, apiKey]
  );

  const deleteHistoryItem = React.useCallback((id: string) => {
    setScanHistory(prev => prev.filter(item => item.id !== id));
    toast({
      description: 'Item removed from history.',
    });
  }, [toast]);

  const handleScanSuccess = React.useCallback(
    async (decodedText: string) => {
      setIsScanning(false);
      analyzeForm.setValue('qrContent', decodedText);
      await onAnalyzeSubmit({ qrContent: decodedText });
    },
    [analyzeForm, onAnalyzeSubmit]
  );

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    const html5QrCode = new Html5Qrcode('file-scanner-hidden');
    setIsLoading(true);
    try {
      const decodedText = await html5QrCode.scanFile(file, false);
      analyzeForm.setValue('qrContent', decodedText);
      await onAnalyzeSubmit({ qrContent: decodedText });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed', description: 'No QR code found.' });
      setIsLoading(false);
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  if (!isHydrated) return null;

  const isSafeToVisit = activeAnalysis && 
    activeAnalysis.signal !== 'CRIMSON' && 
    activeAnalysis.securityReport?.level !== 'RED' &&
    activeAnalysis.securityReport?.isHarmfulToMinors !== true;

  const isUrlLike = activeAnalysis && /^(https?:\/\/|www\.)|(\.[a-z]{2,})$/i.test(activeAnalysis.qrContent);
  const showContinueButton = activeAnalysis && isUrlLike && isSafeToVisit;

  const getUrl = (content: string) => {
    if (content.startsWith('http')) return content;
    return `https://${content}`;
  };

  if (isScanning) {
    return (
      <main className="container mx-auto flex min-h-screen flex-col p-4">
        <div className="w-full max-w-md mx-auto space-y-4">
          <QrScanner
            onScanSuccess={handleScanSuccess}
            onCancel={() => setIsScanning(false)}
          />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
              <ScanLine className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-tighter text-foreground leading-none">Scanomer</h1>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">QR Scanner</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted transition-colors">
                  <Cog className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-card rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="font-bold">Settings</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="api" className="w-full">
                  <div className="px-6 pb-4 border-b">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
                      <TabsTrigger value="api" className="rounded-md font-bold text-[10px] uppercase">Security</TabsTrigger>
                      <TabsTrigger value="general" className="rounded-md font-bold text-[10px] uppercase">General</TabsTrigger>
                      <TabsTrigger value="about" className="rounded-md font-bold text-[10px] uppercase">About</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="p-6">
                    <TabsContent value="api" className="mt-0 space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gemini API Key</Label>
                        <p className="text-[10px] text-muted-foreground leading-tight">Enables safety checks and deep analysis.</p>
                      </div>
                      <form onSubmit={handleApiKeySave} className="flex gap-2">
                        <Input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="Paste API Key here..." className="h-9 rounded-lg border-muted bg-muted/20 text-xs" />
                        <Button type="submit" className="h-9 rounded-lg px-3"><Save className="h-4 w-4" /></Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="general" className="mt-0 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/20 border rounded-xl">
                        <div className="flex flex-col">
                          <Label className="font-bold text-xs">Dark Mode</Label>
                        </div>
                        <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                      </div>
                      <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-xl space-y-3">
                        <div className="flex flex-col">
                          <Label className="font-bold text-xs text-destructive uppercase tracking-tight">Data Management</Label>
                          <p className="text-[10px] text-muted-foreground">Reset onboarding and clear all records.</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleReset} className="w-full h-8 text-[10px] font-bold uppercase tracking-widest gap-2">
                          <RefreshCcw className="h-3 w-3" /> Reset App Data
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="about" className="mt-0">
                      <ScrollArea className="h-[250px] pr-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Mission</Label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Scanomer is designed to give users absolute confidence when interacting with the physical-to-digital world. By analyzing every QR code for hidden threats, tracking, and adult content, we ensure your digital journey starts safely.
                            </p>
                          </div>
                          <div className="space-y-3 pt-4 border-t">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Developer</Label>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs">BA</div>
                              <div className="flex flex-col">
                                <span className="font-black text-xs uppercase tracking-tight">BL_Abiola</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2 pt-1">
                              <Button variant="outline" size="sm" className="h-8 justify-start gap-3 rounded-lg text-[10px] font-bold" asChild>
                                <a href="https://x.com/BL_Abiola" target="_blank" rel="noopener noreferrer">
                                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                  </svg>
                                  @BL_Abiola
                                </a>
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 justify-start gap-3 rounded-lg text-[10px] font-bold" asChild>
                                <a href="mailto:abiolalabs@gmail.com">
                                  <Mail className="h-3.5 w-3.5 text-primary" /> abiolalabs@gmail.com
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </div>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto grid max-w-5xl grid-cols-1 items-start gap-6 p-4 pt-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-xl border-none bg-card overflow-hidden rounded-2xl">
            <CardHeader className="pb-2 border-b border-border/50 bg-muted/5">
              <CardTitle className="text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground font-black">
                <Zap className="h-3 w-3 text-primary" />
                Scan or Paste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-between px-4 shadow-lg shadow-primary/20 overflow-hidden border-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <ScanLine className="h-5 w-5" />
                      </div>
                      <div className="text-left flex flex-col">
                        <span className="text-xs uppercase tracking-[0.1em] font-black leading-none">Scan QR Code</span>
                        <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest">Camera or Upload</span>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-[calc(100vw-2rem)] sm:w-80 bg-card p-1 border-primary/10 shadow-3xl rounded-2xl">
                  <DropdownMenuItem onClick={() => setIsScanning(true)} className="py-3 px-3 gap-3 cursor-pointer hover:bg-primary/5 rounded-xl mb-1">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-xs text-foreground uppercase tracking-tight">Use Camera</span>
                      <span className="text-[8px] text-muted-foreground font-bold uppercase">Scan in real-time</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="py-3 px-3 gap-3 cursor-pointer hover:bg-primary/5 rounded-xl">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <FileUp className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-xs text-foreground uppercase tracking-tight">Upload Image</span>
                      <span className="text-[8px] text-muted-foreground font-bold uppercase">Select from gallery</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">OR</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <Form {...analyzeForm}>
                <form onSubmit={analyzeForm.handleSubmit(onAnalyzeSubmit)} className="space-y-3">
                  <FormField control={analyzeForm.control} name="qrContent" render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste QR content here..." 
                          className="min-h-[60px] text-xs font-medium resize-none border-primary/10 bg-muted/30 rounded-xl p-3 shadow-inner" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground h-11 shadow-md shadow-accent/20 rounded-xl font-black uppercase tracking-[0.2em] text-[9px]">
                    {isLoading ? 'Checking...' : 'Analyze Content'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-xl border-none bg-card min-h-[400px] flex flex-col rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/5">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <CardTitle className="text-[10px] uppercase tracking-[0.2em] font-black text-foreground">
                  Scan History
                </CardTitle>
              </div>
              <Badge variant="secondary" className="text-[8px] font-black tracking-widest bg-primary/20 text-primary border-none px-2 py-0.5 rounded-full uppercase">{scanHistory.length}</Badge>
            </CardHeader>
            <CardContent className="px-0 flex-1">
              {scanHistory.length > 0 ? (
                <ScrollArea className="h-[450px] px-4">
                  <div className="grid grid-cols-1 gap-3 py-4">
                    {scanHistory.map((item) => (
                      <HistoryItem 
                        key={item.id} 
                        item={item} 
                        onClick={() => setActiveAnalysis(item)} 
                        onDelete={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground/10">
                  <Search className="h-12 w-12" />
                  <p className="text-[8px] font-black uppercase tracking-[0.5em] mt-4">No recent scans.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Analysis Result Modal */}
      {activeAnalysis && (
        <AlertDialog open={!!activeAnalysis} onOpenChange={(o) => !o && setActiveAnalysis(null)}>
          <AlertDialogContent className="w-[94vw] sm:w-full sm:max-w-md bg-card p-0 overflow-hidden border-none shadow-3xl rounded-3xl">
            <button 
              onClick={() => setActiveAnalysis(null)} 
              className="absolute right-3 top-3 p-1 rounded-full hover:bg-muted transition-colors z-30 bg-card/50 backdrop-blur-sm"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <ScrollArea className="max-h-[82vh]">
              <div className="p-0">
                <AnalysisResultDisplay result={activeAnalysis} isLoading={false} />
              </div>

              <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 p-3 sm:p-5 pt-0 mt-1">
                <AlertDialogCancel className="w-full sm:flex-1 h-10 gap-2 m-0 bg-muted hover:bg-muted/80 border-none rounded-xl font-black uppercase text-[8px] tracking-[0.2em]">
                  <ArrowLeft className="h-3 w-3" /> Go Back
                </AlertDialogCancel>
                {showContinueButton && (
                  <AlertDialogAction asChild className="w-full sm:flex-1 h-10 m-0 shadow-lg transition-all bg-primary text-primary-foreground shadow-primary/30 rounded-xl font-black uppercase text-[8px] tracking-[0.2em] border-none group">
                    <a href={getUrl(activeAnalysis.qrContent)} target="_blank" rel="noopener noreferrer" className="gap-2">
                      <Globe className="h-3 w-3" />
                      Continue to Site
                    </a>
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </ScrollArea>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="sm:max-w-md bg-card border-none shadow-4xl rounded-3xl p-0 overflow-hidden">
          <div className="bg-primary/10 p-8 flex flex-col items-center justify-center gap-4 text-center border-b border-primary/10">
            <div className="bg-primary p-4 rounded-2xl shadow-xl shadow-primary/20">
              <ScanLine className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tighter uppercase">Welcome to Scanomer</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary opacity-80">Safe QR Scanner</p>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-tight">Instant Confidence</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Instantly verify the safety and intent of any QR code before you click.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Info className="h-4 w-4 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-tight">Safe for Minors</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Automatic filtering of adult content and malicious phishing links.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-tight">AI Powered</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Optional Gemini AI integration for deep safety checks on destination servers.</p>
                </div>
              </div>
            </div>
            <Button onClick={closeOnboarding} className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-primary/20">
              Get Started
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div id="file-scanner-hidden" className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </div>
  );
}
