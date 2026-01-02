import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bot, User, Loader2, ImagePlus, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Xatolik",
          description: "Rasm hajmi 5MB dan oshmasligi kerak",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setImageFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage = input.trim();
    const userImage = selectedImage;
    
    setInput('');
    setSelectedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    const newUserMessage: Message = { 
      role: 'user', 
      content: userMessage || (userImage ? "Bu o'simlikni tahlil qiling" : ''),
      image: userImage || undefined
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const requestBody: any = { 
        message: userMessage || "Bu rasmda ko'rsatilgan o'simlikni tahlil qiling. Agar kasallik bo'lsa, uni aniqlang va davolash usullarini ayting."
      };
      
      if (userImage) {
        requestBody.image = userImage;
      }

      const { data, error } = await supabase.functions.invoke('ai-farm-assistant', {
        body: requestBody
      });

      if (error) throw error;

      if (data?.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        throw new Error('Javob olinmadi');
      }
    } catch (error: any) {
      console.error('AI xatolik:', error);
      toast({
        title: "Xatolik",
        description: error.message || "AI bilan bog'lanishda xatolik",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[850px] bg-card rounded-lg border border-border shadow-lg">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 py-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6" />
          <div>
            <h2 className="text-xl font-bold">AI Fermer Yordamchisi</h2>
            <p className="text-sm opacity-90">Qishloq xo'jaligi va o'simlik kasalliklari bo'yicha maslahat</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Assalomu alaykum!</p>
              <p className="text-sm mb-4">Qishloq xo'jaligi bo'yicha savollaringizni bering</p>
              <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                <ImagePlus className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-foreground">O'simlik rasmini yuklang</p>
                <p className="text-xs mt-1">AI kasalliklarni aniqlaydi va davolash yo'llarini tavsiya qiladi</p>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.image && (
                  <img 
                    src={message.image} 
                    alt="Yuklangan rasm" 
                    className="max-w-full max-h-48 rounded-lg mb-2 object-contain"
                  />
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tahlil qilinmoqda...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Image Preview */}
      {selectedImage && (
        <div className="px-4 py-2 border-t border-border">
          <div className="relative inline-block">
            <img 
              src={selectedImage} 
              alt="Tanlangan rasm" 
              className="h-20 w-20 object-cover rounded-lg border-2 border-primary"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Rasm tahlil uchun tayyor</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <div className="flex-1 flex flex-col gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Rasm haqida savol yozing yoki bo'sh qoldiring..." : "Savolingizni yozing yoki rasm yuklang..."}
              className="min-h-[100px] resize-none text-base"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-2 self-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Rasm yuklash"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Button 
              type="submit" 
              disabled={(!input.trim() && !selectedImage) || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          📷 Rasm yuklang - o'simlik kasalliklarini aniqlash | Enter - yuborish
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;