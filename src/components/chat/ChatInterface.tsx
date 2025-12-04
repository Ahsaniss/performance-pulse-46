import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Paperclip, FileText, Image as ImageIcon, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SOCKET_URL = 'http://localhost:5000';

interface ChatInterfaceProps {
  defaultSelectedUser?: string;
  hideSidebar?: boolean;
}

export default function ChatInterface({ defaultSelectedUser, hideSidebar = false }: ChatInterfaceProps) {
  const { user } = useAuth();
  // Fetch all users including admins so we can filter based on role
  const { employees: allUsers } = useEmployees({ includeAdmins: true });
  const [selectedUser, setSelectedUser] = useState<string | null>(defaultSelectedUser || null);
  const { messages: initialMessages, sendMessage, refetch } = useMessages(selectedUser || undefined);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize socket
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    
    if (user?.id) {
      socketRef.current.emit('join_room', user.id);
    }

    socketRef.current.on('receive_message', (message) => {
      const normalizedMessage = {
        ...message,
        id: message._id,
        from: message.from?._id || message.from,
        timestamp: message.createdAt
      };
      setMessages((prev) => [...prev, normalizedMessage]);
      refetch();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?.id, refetch]);

  // Sync messages from query to local state
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUser]);

  const chatUsers = allUsers?.filter(u => {
    if (u.id === user?.id) return false; // Don't show self

    if (user?.role === 'admin') {
      // Admin sees only employees (and maybe other admins if needed, but request says "admin can chat induviaul emoployee")
      return u.role === 'employee';
    } else {
      // Employee sees only admins
      return u.role === 'admin';
    }
  }) || [];

  const handleSend = async () => {
    if ((!newMessage.trim() && files.length === 0) || !selectedUser) return;

    const formData = new FormData();
    formData.append('to', selectedUser);
    formData.append('subject', 'Chat Message');
    formData.append('content', newMessage || 'Sent an attachment');
    formData.append('type', 'individual');
    
    files.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      await sendMessage(formData);
      setNewMessage('');
      setFiles([]);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Filter messages for the selected conversation
  // Since the backend now filters by conversation when selectedUser is present, 
  // we can just use the messages as is, or still filter to be safe/handle 'all' messages correctly.
  const conversationMessages = messages.filter(msg => {
    if (!selectedUser) return true; // Should not happen in this view
    
    const fromId = typeof msg.from === 'object' ? msg.from._id : msg.from;
    
    // Include broadcast messages
    if (msg.to === 'all') return true;

    // Include messages between me and selected user
    return (
      (fromId === user?.id && msg.to === selectedUser) ||
      (fromId === selectedUser && msg.to === user?.id)
    );
  }).sort((a, b) => new Date(a.createdAt || a.timestamp).getTime() - new Date(b.createdAt || b.timestamp).getTime());

  return (
    <div className="flex h-[600px] gap-4">
      {/* Sidebar */}
      {!hideSidebar && (
        <Card className="w-1/3 flex flex-col">
          <CardHeader className="p-4 border-b">
            <CardTitle>Chats</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {chatUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${selectedUser === u.id ? 'bg-accent' : ''}`}
                >
                  <Avatar>
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <CardHeader className="p-4 border-b flex flex-row items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={chatUsers.find(u => u.id === selectedUser)?.avatar} />
                <AvatarFallback>{chatUsers.find(u => u.id === selectedUser)?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{chatUsers.find(u => u.id === selectedUser)?.name}</p>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversationMessages.map((msg, index) => {
                  const fromId = typeof msg.from === 'object' ? msg.from._id : msg.from;
                  const isMe = fromId === user?.id;
                  return (
                    <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((att: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-background/20 rounded text-sm">
                                {att.mimetype?.startsWith('image/') ? (
                                  <ImageIcon className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                                <a 
                                  href={`${import.meta.env.VITE_API_URL}${att.path}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline truncate max-w-[150px] text-inherit"
                                >
                                  {att.originalName || att.filename}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.createdAt || msg.timestamp), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button onClick={() => removeFile(i)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.xml,.doc,.docx,.xls,.xlsx,.txt"
                />
                <Input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                <Button onClick={handleSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a user to start chatting
          </div>
        )}
      </Card>
    </div>
  );
}