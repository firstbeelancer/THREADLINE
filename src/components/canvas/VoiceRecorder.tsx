import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Upload, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Card } from '@/types';

interface VoiceRecorderProps {
  card: Card;
  onUpdate: (updates: Partial<Card>) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

export function VoiceRecorder({ card, onUpdate }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        onUpdate({
          content: {
            ...card.content,
            audioUrl: url,
            audioMime: mimeType,
            audioSize: formatFileSize(blob.size),
            audioDuration: elapsed,
            audioName: `recording_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.webm`,
          },
        });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Нет доступа к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      toast.error('Это не аудиофайл');
      return;
    }
    const url = URL.createObjectURL(file);
    onUpdate({
      content: {
        ...card.content,
        audioUrl: url,
        audioMime: file.type,
        audioSize: formatFileSize(file.size),
        audioName: file.name,
      },
    });
    e.target.value = '';
  };

  const removeAudio = () => {
    onUpdate({
      content: {
        ...card.content,
        audioUrl: undefined,
        audioMime: undefined,
        audioSize: undefined,
        audioName: undefined,
        audioDuration: undefined,
        transcript: undefined,
        transcriptSummary: undefined,
      },
    });
  };

  const transcribe = async () => {
    // Заглушка: позже заменишь на реальный AI-вызов
    setTranscribing(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const placeholder =
        '[Заглушка транскрипции] Здесь появится автоматически расшифрованный текст из вашей аудиозаписи. ' +
        'Без «эээ», пауз и слов-паразитов — только суть. Подключите выбранную AI-модель в VoiceRecorder.transcribe().';
      onUpdate({
        content: {
          ...card.content,
          transcript: placeholder,
          transcriptSummary: 'Краткое резюме появится здесь после подключения AI.',
        },
      });
      toast.success('Транскрипция готова (заглушка)');
    } catch (err) {
      console.error(err);
      toast.error('Не удалось транскрибировать');
    } finally {
      setTranscribing(false);
    }
  };

  const audioUrl = card.content?.audioUrl as string | undefined;
  const audioName = card.content?.audioName as string | undefined;
  const audioSize = card.content?.audioSize as string | undefined;

  return (
    <>
      <div>
        <div className="text-[9.5px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(255,8%,40%)' }}>
          Аудиозапись
        </div>

        {!audioUrl && (
          <div className="space-y-2">
            {/* Record button */}
            <button
              onClick={recording ? stopRecording : startRecording}
              className="w-full h-[60px] flex items-center justify-center gap-3 rounded-[8px] cursor-pointer transition-all"
              style={{
                background: recording ? 'rgba(236,72,153,0.15)' : 'hsl(240, 20%, 9%)',
                border: `1px solid ${recording ? '#EC4899' : 'rgba(255,255,255,0.05)'}`,
                color: recording ? '#EC4899' : 'hsl(260, 20%, 92%)',
                boxShadow: recording ? '0 0 16px rgba(236,72,153,0.25)' : 'none',
              }}
            >
              {recording ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span className="text-xs font-medium">Стоп</span>
                  <span className="text-xs font-mono opacity-80">{formatTime(elapsed)}</span>
                  <span className="ml-1 w-2 h-2 rounded-full animate-pulse" style={{ background: '#EC4899' }} />
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span className="text-xs font-medium">Записать</span>
                </>
              )}
            </button>

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 w-full py-[5px] px-[10px] rounded-md text-[10.5px] cursor-pointer transition-all"
              style={{
                background: 'hsl(240, 20%, 9%)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: 'hsl(255,8%,62%)',
              }}
            >
              <Upload className="w-[11px] h-[11px]" />
              Загрузить аудиофайл (любой формат)
            </button>
          </div>
        )}

        {audioUrl && (
          <div className="space-y-2">
            <div
              className="p-2.5 rounded-[8px] flex flex-col gap-2"
              style={{ background: 'hsl(240, 33%, 4%)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 shrink-0" style={{ color: '#EC4899' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] font-medium truncate" style={{ color: 'hsl(260, 20%, 92%)' }}>
                    {audioName || 'Запись'}
                  </div>
                  {audioSize && (
                    <div className="text-[9.5px] font-mono" style={{ color: 'hsl(255,8%,40%)' }}>
                      {audioSize}
                    </div>
                  )}
                </div>
                <button
                  onClick={removeAudio}
                  className="w-6 h-6 flex items-center justify-center rounded cursor-pointer transition-all"
                  style={{ color: 'hsl(255,8%,40%)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'hsl(255,8%,40%)'; e.currentTarget.style.background = 'transparent'; }}
                  title="Удалить"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <audio src={audioUrl} controls className="w-full h-8" style={{ filter: 'invert(0.85) hue-rotate(180deg)' }} />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={transcribe}
              disabled={transcribing}
              className="w-full gap-1.5 h-8 text-[10.5px]"
            >
              {transcribing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Транскрибируем...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  {card.content?.transcript ? 'Сделать заново' : 'Транскрибировать AI'}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {card.content?.transcript && (
        <div>
          <div className="text-[9.5px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(255,8%,40%)' }}>
            Транскрипт
          </div>
          <Textarea
            value={card.content.transcript || ''}
            onChange={(e) => onUpdate({ content: { ...card.content, transcript: e.target.value } })}
            rows={5}
            className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] resize-none text-xs italic"
          />
        </div>
      )}

      {card.content?.transcriptSummary && (
        <div>
          <div className="text-[9.5px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'hsl(255,8%,40%)' }}>
            Краткое резюме
          </div>
          <Textarea
            value={card.content.transcriptSummary || ''}
            onChange={(e) => onUpdate({ content: { ...card.content, transcriptSummary: e.target.value } })}
            rows={3}
            className="bg-[hsl(240,20%,9%)] border-[rgba(255,255,255,0.05)] resize-none text-xs"
          />
        </div>
      )}
    </>
  );
}
