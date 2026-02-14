'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Download } from 'lucide-react';

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

const formSchema = z.object({
  content: z.string().min(1, 'Content to encode cannot be empty.'),
});

export function QrGenerator() {
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  const generateQrCode = async (content: string) => {
    setIsLoading(true);
    setQrCodeDataUrl(null);
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
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    generateQrCode(values.content);
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

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
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
          <Button type="submit" disabled={isLoading} className="w-full" size="lg">
            {isLoading ? 'Generating...' : 'Generate QR Code'}
          </Button>
        </form>
      </Form>

      {qrCodeDataUrl && !isLoading && (
        <Card>
          <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <p className="text-sm text-muted-foreground">Your QR Code is ready!</p>
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
