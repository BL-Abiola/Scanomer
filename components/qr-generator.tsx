'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Download, Sparkles } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { generateQrWithAiAction } from '@/app/actions';

const manualFormSchema = z.object({
  content: z.string().min(1, 'Content to encode cannot be empty.'),
});

const aiFormSchema = z.object({
  intent: z.string().min(1, 'Your intent cannot be empty.'),
});

export function QrGenerator({ apiKey }: { apiKey: string | null }) {
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null);
  const [isManualLoading, setIsManualLoading] = React.useState(false);
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  const manualForm = useForm<z.infer<typeof manualFormSchema>>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: {
      content: '',
    },
  });

  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: {
      intent: '',
    },
  });

  const generateQrCode = async (content: string) => {
    try {
      const url = await QRCode.toDataURL(content, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 512,
      });
      setQrCodeDataUrl(url);
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'QR Generation Error',
        description: 'Could not generate QR code. Please try again.',
      });
      setQrCodeDataUrl(null);
    }
  };

  const onManualSubmit = async (values: z.infer<typeof manualFormSchema>) => {
    setIsManualLoading(true);
    setQrCodeDataUrl(null);
    await generateQrCode(values.content);
    setIsManualLoading(false);
  };

  const onAiSubmit = async (values: z.infer<typeof aiFormSchema>) => {
    setIsAiLoading(true);
    setQrCodeDataUrl(null);

    const result = await generateQrWithAiAction(values.intent, apiKey);

    if (result.success && result.content) {
      await generateQrCode(result.content);
    } else {
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: result.error || 'An unknown error occurred.',
      });
    }

    setIsAiLoading(false);
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = isManualLoading || isAiLoading;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="mr-2 h-4 w-4" />
            AI
          </TabsTrigger>
        </TabsList>
        <TabsContent value="manual" className="pt-6">
          <Form {...manualForm}>
            <form
              onSubmit={manualForm.handleSubmit(onManualSubmit)}
              className="space-y-4"
            >
              <FormField
                control={manualForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Content to Encode</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any text, URL, or data to generate a QR code..."
                        className="min-h-[100px] resize-y text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isManualLoading}
                className="w-full"
                size="lg"
              >
                {isManualLoading ? 'Generating...' : 'Generate QR Code'}
              </Button>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="ai" className="pt-6">
          <Form {...aiForm}>
            <form
              onSubmit={aiForm.handleSubmit(onAiSubmit)}
              className="space-y-4"
            >
              <FormField
                control={aiForm.control}
                name="intent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Your Intent</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what you want the QR code to do. For example: 'A Wi-Fi code for my network HomeNet with password 12345' or 'A link to my portfolio at example.com'"
                        className="min-h-[100px] resize-y text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={isAiLoading}
                className="w-full"
                size="lg"
              >
                {isAiLoading ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate with AI
                  </>
                )}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      {(qrCodeDataUrl && !isLoading) && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Your QR Code is ready!
              </p>
              <div className="rounded-lg border bg-white p-2">
                <Image
                  src={qrCodeDataUrl}
                  alt="Generated QR Code"
                  width={200}
                  height={200}
                />
              </div>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Skeleton className="h-[218px] w-[218px] rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
