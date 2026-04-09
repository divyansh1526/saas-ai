'use client';

import { FormEvent, useState } from 'react';
import { Companion, Message } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useCompletion } from '@ai-sdk/react';

import ChatHeader from '@/components/chat-header';
import ChatForm from '@/components/chat-form';
import ChatMessages from '@/components/chat-messages';
import { ChatMessageProps } from '@/components/chat-message';

interface ChatClientProps {
  companion: Companion & {
    messages: Message[];
    _count: {
      messages: number;
    };
  };
}

export default function ChatClient({ companion }: ChatClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>(companion.messages);

  const { input, isLoading, handleInputChange, handleSubmit, setInput } =
    useCompletion({
      api: `/api/chat/${companion.id}`,
      streamProtocol: 'text',
      onFinish(prompt, completion) {
        const systemMessage: ChatMessageProps = {
          role: 'system',
          content: completion,
        };

        setMessages((current) => [...current, systemMessage]);
        setInput('');

        router.refresh();
      },
    });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const userMessage: ChatMessageProps = {
      role: 'user',
      content: input,
    };

    setMessages((current) => [...current, userMessage]);

    handleSubmit(e);
  };
  return (
    <div className='flex flex-col h-screen'>
      <ChatHeader companion={companion} />

      <div className='flex-1 overflow-y-auto p-4'>
        <ChatMessages
          companion={companion}
          isLoading={isLoading}
          messages={messages}
        />
      </div>

      <div className='p-4'>
        <ChatForm
          handleInputChange={handleInputChange}
          input={input}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
