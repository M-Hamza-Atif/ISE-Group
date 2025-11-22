import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

interface AppealDialogProps {
  userId: string;
  userName: string;
}

const AppealDialog = ({ userId, userName }: AppealDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const appealReasons = [
    'Account suspended by mistake',
    'Misunderstanding in reported incident',
    'False accusations',
    'Already resolved the issue',
    'Other',
  ];

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    if (!description.trim()) {
      toast.error('Please provide details about your appeal');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from('appeals')
      .insert({
        user_id: userId,
        reason,
        description: description.trim(),
      });

    setSubmitting(false);

    if (error) {
      toast.error('Failed to submit appeal');
      return;
    }

    toast.success('Appeal submitted successfully');
    toast.info('An admin will review your appeal shortly');
    setOpen(false);
    setReason('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <AlertCircle className="mr-2 h-4 w-4" />
          Submit Appeal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit an Appeal</DialogTitle>
          <DialogDescription>
            If you believe your account was suspended unfairly, submit an appeal for admin review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Appeal *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {appealReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Explanation *</Label>
            <Textarea
              id="description"
              placeholder="Explain why you believe your suspension should be reviewed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Be clear and honest. Include any relevant details that support your appeal.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Appeal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppealDialog;
