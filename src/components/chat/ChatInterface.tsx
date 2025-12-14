import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { useEmployees } from '@/hooks/useEmployees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, FileText, Image as ImageIcon, X, Search, MessageSquare } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize socket
  useEffect(() => {
    // Get token from localStorage (assuming it's stored there)
    const token = localStorage.getItem('token');
    
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: token
      }
    });
    
    // Handle connection errors
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      toast.error('Failed to connect to chat server');
    });
    
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
    
    // Handle error events from server
    socketRef.current.on('error', (error) => {
      toast.error(error.message || 'An error occurred');
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

  // Filter users based on search query
  const filteredChatUsers = chatUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Card className="w-80 flex flex-col border-2 shadow-lg">
          <CardHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Messages</CardTitle>
              <Badge variant="secondary" className="ml-auto">
                {filteredChatUsers.length}
              </Badge>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="pl-9 h-9 bg-background/50"
              />
            </div>
          </CardHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredChatUsers.length > 0 ? (
                filteredChatUsers.map(u => {
                  const unreadCount = messages.filter(msg => {
                    const fromId = typeof msg.from === 'object' ? msg.from._id : msg.from;
                    return fromId === u.id && msg.to === user?.id && !msg.read;
                  }).length;

                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedUser === u.id 
                          ? 'bg-primary/15 border-2 border-primary/30 shadow-sm' 
                          : 'hover:bg-accent/50 border-2 border-transparent'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 ring-2 ring-background">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                            {u.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                      </div>
                      
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate text-sm">{u.name}</p>
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 min-w-5 rounded-full text-[10px] px-1.5">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">{u.position || u.role}</p>
                          {u.department && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground truncate">{u.department}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No employees found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col border-2 shadow-lg">
        {selectedUser ? (
          <>
            <CardHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5 flex flex-row items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-background">
                <AvatarImage src={filteredChatUsers.find(u => u.id === selectedUser)?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                  {filteredChatUsers.find(u => u.id === selectedUser)?.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-base">{filteredChatUsers.find(u => u.id === selectedUser)?.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-muted/20">
              <div className="space-y-4">
                {conversationMessages.map((msg, index) => {
                  const fromId = typeof msg.from === 'object' ? msg.from._id : msg.from;
                  const isMe = fromId === user?.id;
                  return (
                    <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-card border rounded-bl-sm'
                      }`}>
                        {msg.content && <p className="whitespace-pre-wrap text-sm">{msg.content}</p>}
                        
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((att: any, i: number) => (
                              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                isMe ? 'bg-primary-foreground/10' : 'bg-muted'
                              }`}>
                                {att.mimetype?.startsWith('image/') ? (
                                  <ImageIcon className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                  <FileText className="h-4 w-4 flex-shrink-0" />
                                )}
                                <a 
                                  href={`${import.meta.env.VITE_API_URL}${att.path}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline truncate max-w-[150px]"
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

            <div className="p-4 border-t bg-background">
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full text-xs border">
                      <FileText className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <button onClick={() => removeFile(i)} className="hover:text-destructive transition-colors">
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
                  className="hover:bg-primary/10 hover:text-primary transition-colors"
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
                  className="border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <Button 
                  onClick={handleSend}
                  className="px-6 shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-b from-background to-muted/20">
            <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Choose an employee to start messaging</p>
          </div>
        )}
      </Card>
    </div>
  );
}