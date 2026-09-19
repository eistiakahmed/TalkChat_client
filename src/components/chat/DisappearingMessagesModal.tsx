'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Check } from 'lucide-react';
import { Modal, Button, Spinner } from '../ui';
import { chatService } from '../../services/chat.service';
import { cn } from '../../utils/cn';

interface DisappearingMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentDuration?: number | null;
}

const TIMER_OPTIONS = [
  { label: 'Off', description: 'Messages stay in the conversation permanently', seconds: 0 },
  { label: '24 Hours', description: 'Messages automatically vanish 24 hours after being sent', seconds: 86400 },
  { label: '7 Days', description: 'Messages automatically vanish 7 days after being sent', seconds: 604800 },
  { label: '90 Days', description: 'Messages automatically vanish 90 days after being sent', seconds: 7776000 },
];

/**
 * Disappearing Messages Configuration Modal.
 * 
 * Configures the lifespan of future messages sent in the conversation
 * (Off, 24 Hours, 7 Days, or 90 Days).
 * 
 * @see https://github.com/eistiakahmed/TalkChat_server
 */
export function DisappearingMessagesModal({
  isOpen,
  onClose,
  conversationId,
  currentDuration = 0,
}: DisappearingMessagesModalProps) {
  const queryClient = useQueryClient();
  const [selectedSeconds, setSelectedSeconds] = React.useState<number>(
    currentDuration || 0
  );

  React.useEffect(() => {
    setSelectedSeconds(currentDuration || 0);
  }, [currentDuration, isOpen]);

  const mutation = useMutation({
    mutationFn: async (duration: number) => {
      await chatService.updateDisappearingTimer({
        conversationId,
        duration,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onClose();
    },
  });

  const handleSave = () => {
    mutation.mutate(selectedSeconds);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disappearing Messages"
      description="For added privacy, new messages will disappear from this chat for everyone after the chosen period."
    >
      <div className="space-y-4 pt-2">
        {/* Banner with Clock Icon */}
        <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs text-muted-foreground">
            Setting this timer will only affect new messages sent after saving. Existing messages remain unchanged.
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-2">
          {TIMER_OPTIONS.map((option) => {
            const isSelected = selectedSeconds === option.seconds;
            return (
              <div
                key={option.seconds}
                onClick={() => setSelectedSeconds(option.seconds)}
                className={cn(
                  'p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between',
                  isSelected
                    ? 'border-brand-600 bg-brand-500/10 dark:bg-brand-500/15'
                    : 'border-border bg-card/60 hover:border-border hover:bg-muted/40'
                )}
              >
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {option.label}
                  </h4>
                  <p className="text-xs text-muted-foreground pt-0.5">
                    {option.description}
                  </p>
                </div>

                <div
                  className={cn(
                    'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-muted-foreground/40'
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span>Saving...</span>
              </div>
            ) : (
              'Apply Timer'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
