import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Employee {
  id: string;
  full_name: string;
}

interface MessageDialogProps {
  employees: Employee[];
}

export function MessageDialog({ employees }: MessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipient, setRecipient] = useState("all");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSendMessage = async () => {
    if (!subject || !content) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (recipient === "all") {
        // Broadcast message
        const { error } = await supabase
          .from('messages')
          .insert({
            from_user: user?.id,
            to_user: null,
            is_broadcast: true,
            subject,
            content,
          });

        if (error) throw error;
      } else {
        // Individual message
        const { error } = await supabase
          .from('messages')
          .insert({
            from_user: user?.id,
            to_user: recipient,
            is_broadcast: false,
            subject,
            content,
          });

        if (error) throw error;
      }

      toast.success("Message sent successfully!");
      setSubject("");
      setContent("");
      setRecipient("all");
      setOpen(false);
    } catch (error: any) {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Mail className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Message to Employees</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees (Broadcast)</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Enter your message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
            />
          </div>

          <Button onClick={handleSendMessage} disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
