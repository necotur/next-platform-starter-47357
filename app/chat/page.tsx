

'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Send, Image as ImageIcon, Loader2, ArrowLeft, X, ZoomIn } from 'lucide-react';
import Link from 'next/link';
import { PhotoDisplay } from '@/components/photo-display';

interface Message {
  id: string;
  content: string;
  messageType: string;
  photoUrl: string | null;
  createdAt: string;
  isRead: boolean;
  sender: {
    id: string;
    fullName: string;
    image: string | null;
    role: string;
  };
}

interface ConnectedUser {
  id: string;
  fullName: string;
  specialty?: string;
  clinicName?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectedUser, setConnectedUser] = useState<ConnectedUser | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      checkConnection();
    }
  }, [status, router]);

  useEffect(() => {
    if (connectedUser) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [connectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkConnection = async () => {
    try {
      const user = session?.user as any;
      
      // Check if userId is provided in query params (for doctor selecting a patient)
      const urlParams = new URLSearchParams(window.location.search);
      const selectedUserId = urlParams.get('userId');
      
      if (user?.role === 'doctor') {
        // Doctor needs to have a patient selected
        if (selectedUserId) {
          const response = await fetch('/api/doctor/patients');
          if (response.ok) {
            const patients = await response.json();
            const selectedPatient = patients.find((p: any) => p.id === selectedUserId);
            if (selectedPatient) {
              setConnectedUser({
                id: selectedPatient.id,
                fullName: selectedPatient.fullName || 'Patient',
              });
            } else {
              router.push('/doctor/patients');
            }
          }
        } else {
          // No patient selected, redirect to patients list
          router.push('/doctor/patients');
        }
      } else if (user?.role === 'patient') {
        // Patient connecting with their doctor
        const response = await fetch('/api/patient/connect');
        if (response.ok) {
          const data = await response.json();
          if (data.connected && data.doctor) {
            setConnectedUser(data.doctor);
          } else {
            router.push('/settings');
          }
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!connectedUser) return;

    try {
      const response = await fetch(`/api/chat?userId=${connectedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !connectedUser || sending) return;

    setSending(true);
    setUploading(true);
    try {
      let photoUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);

        const uploadResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const { cloudStoragePath } = await uploadResponse.json();
          photoUrl = cloudStoragePath;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      // Send message
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: connectedUser.id,
          content: newMessage.trim() || (photoUrl ? 'Photo' : ''),
          messageType: photoUrl ? 'photo' : 'text',
          photoUrl,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        clearSelectedImage();
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  const currentUser = session?.user as any;

  return (
    <div className="h-screen flex flex-col max-w-full overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <div className="bg-white border-b shadow-sm flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href={currentUser?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'}
              className="text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: '#3F0F22' }}>
                {connectedUser?.fullName}
              </h1>
              {connectedUser?.specialty && (
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {connectedUser.specialty} • {connectedUser.clinicName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender.id === currentUser?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl ${
                        message.messageType === 'photo' ? 'p-2' : 'px-4 py-3'
                      } ${
                        isOwnMessage
                          ? 'text-white'
                          : 'bg-white'
                      }`}
                      style={isOwnMessage ? { backgroundColor: '#AF4B6C' } : {}}
                    >
                      {message.messageType === 'photo' && message.photoUrl ? (
                        <div className="space-y-2">
                          <div 
                            className="relative w-full max-w-[240px] sm:w-64 aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                            onClick={() => setFullscreenPhoto(message.photoUrl)}
                          >
                            <PhotoDisplay 
                              cloudStoragePath={message.photoUrl}
                              alt="Shared photo"
                              className="w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="p-2 bg-white/90 rounded-full">
                                <ZoomIn className="w-5 h-5" style={{ color: '#3F0F22' }} />
                              </div>
                            </div>
                          </div>
                          {message.content && message.content !== 'Photo' && (
                            <p className="text-sm px-2 break-words">{message.content}</p>
                          )}
                          <p className={`text-xs px-2 ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm mb-1 break-words">{message.content}</p>
                          <p className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t flex-shrink-0 safe-bottom">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Image Preview */}
          {previewUrl && (
            <div className="mb-3 relative inline-block">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={previewUrl}
                  alt="Selected image"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={clearSelectedImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex items-center gap-2 sm:gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              className="p-2 sm:p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50 flex-shrink-0"
              style={{ color: '#AF4B6C' }}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm sm:text-base"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage) || sending}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-50 flex-shrink-0"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Fullscreen Photo Modal */}
      {fullscreenPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setFullscreenPhoto(null)}
        >
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-4xl aspect-square">
            <PhotoDisplay 
              cloudStoragePath={fullscreenPhoto}
              alt="Full size photo"
              className="w-full h-full rounded-lg overflow-hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}
