"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Bot, Coins, Loader2, Maximize2, Minimize2, Plus, Send, Settings, Sparkles, Trash, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Chat, Message } from "@/types/chat"

export default function Dashboard() {
  const [chats, setChats] = useState<Chat[]>([])

  const [activeChat, setActiveChat] = useState<string>("")
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  // Always use Gemini model as requested
  const selectedModel = "gemini"
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chats])

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New conversation",
      model: selectedModel,
      messages: [],
    }
    setChats([...chats, newChat])
    setActiveChat(newChat.id)
    setInput("")
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Find the current chat
    const currentChatIndex = chats.findIndex((chat) => chat.id === activeChat)
    if (currentChatIndex === -1) return

    // Create a copy of the chats array
    const updatedChats = [...chats]

    // Add the user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    updatedChats[currentChatIndex].messages.push(userMessage)

    // Update the chat title if it's the first message
    if (updatedChats[currentChatIndex].messages.length === 1) {
      updatedChats[currentChatIndex].title = input.slice(0, 30) + (input.length > 30 ? "..." : "")
    }

    setChats(updatedChats)
    setInput("")

    // Send message to API
    setIsGenerating(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedChats[currentChatIndex].messages,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message.content,
      }

      updatedChats[currentChatIndex].messages.push(assistantMessage)
      setChats([...updatedChats])
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again later.",
      }
      
      updatedChats[currentChatIndex].messages.push(errorMessage)
      setChats([...updatedChats])
    } finally {
      setIsGenerating(false)
    }
  }

  // No model change function needed as we're only using Gemini

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [chatToRename, setChatToRename] = useState<string>("")
  const [newChatTitle, setNewChatTitle] = useState<string>("")

  const handleRenameChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId)
    if (chat) {
      setChatToRename(chatId)
      setNewChatTitle(chat.title)
      setIsRenameDialogOpen(true)
    }
  }

  const handleSaveRename = () => {
    if (!newChatTitle.trim()) return

    const updatedChats = chats.map(chat => {
      if (chat.id === chatToRename) {
        return { ...chat, title: newChatTitle.trim() }
      }
      return chat
    })

    setChats(updatedChats)
    setIsRenameDialogOpen(false)
    setChatToRename("")
    setNewChatTitle("")
  }

  const handleDeleteChat = (chatId: string) => {
    const updatedChats = chats.filter(chat => chat.id !== chatId)
    setChats(updatedChats)
    
    // If we're deleting the active chat, set a new active chat
    if (chatId === activeChat) {
      if (updatedChats.length > 0) {
        setActiveChat(updatedChats[0].id)
      } else {
        setActiveChat("")
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const currentChat = chats.find((chat) => chat.id === activeChat)

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-black text-white">
        <Sidebar className="border-r border-gray-800 bg-gray-950">
          <SidebarHeader className="p-3">
            <Button
              onClick={handleNewChat}
              className="w-full justify-start gap-2 bg-emerald-500 text-black hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              New chat
            </Button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id} className="group">
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuButton
                      onClick={() => setActiveChat(chat.id)}
                      isActive={activeChat === chat.id}
                      className="justify-start gap-2 text-sm flex-1"
                    >
                      <Bot className="h-4 w-4" />
                      <span className="truncate">{chat.title}</span>
                    </SidebarMenuButton>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameChat(chat.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"></path>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-800 p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="justify-start gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/" className="w-full">
                  <SidebarMenuButton className="justify-start gap-2 text-sm">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main
          className={cn(
            "relative flex flex-1 flex-col bg-gradient-to-b from-gray-900 to-black transition-all duration-300",
            isFullscreen ? "fixed inset-0 z-50" : "",
          )}
        >
          {/* Header */}
          <header className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-400" />
              <span className="font-medium">DeFi Copilot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-md text-sm text-emerald-400 flex items-center gap-1">
                <Bot className="h-4 w-4" />
                <span>Gemini</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-gray-400 hover:text-white"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </div>
          </header>

          {/* Chat area */}
          <div className="flex-1 overflow-auto p-4 md:px-20 lg:px-32">
            {currentChat && currentChat.messages.length > 0 ? (
              <div className="space-y-6">
                {currentChat.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-4 rounded-lg p-4",
                      message.role === "user" ? "bg-gray-800/50" : "bg-gray-900/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        message.role === "user" ? "bg-gray-700" : "bg-emerald-500/20 text-emerald-400",
                      )}
                    >
                      {message.role === "user" ? "U" : <Bot className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="font-medium">{message.role === "user" ? "You" : "DeFi Copilot"}</div>
                      <div className="whitespace-pre-wrap text-gray-300">{message.content}</div>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-start gap-4 rounded-lg bg-gray-900/50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">DeFi Copilot</div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div
                          className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-8 rounded-full bg-emerald-500/10 p-4">
                  <Sparkles className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">How can I help with DeFi today?</h2>
                <p className="mb-8 text-center text-gray-400">
                  Ask about yield strategies, token analysis, or market trends
                </p>
                <div className="grid w-full max-w-md gap-3 md:grid-cols-2">
                  {[
                    "Compare ETH staking options",
                    "Analyze AAVE vs Compound",
                    "Explain impermanent loss",
                    "Best yield for stablecoins",
                  ].map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="justify-start border-gray-800 bg-gray-900/50 text-left hover:bg-gray-800"
                      onClick={() => {
                        setInput(suggestion)
                        if (textareaRef.current) {
                          textareaRef.current.focus()
                        }
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-800 p-4 md:px-20 lg:px-32">
            <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-lg border border-gray-800 bg-gray-900 p-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about DeFi strategies, protocols, or market analysis..."
                className="min-h-[60px] max-h-[200px] flex-1 resize-none border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isGenerating}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-md bg-emerald-500 text-black hover:bg-emerald-600"
              >
                {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
            <div className="mt-2 text-center text-xs text-gray-500">
              DeFi Copilot can make mistakes. Consider checking important information.
            </div>
          </div>
        </main>
      </div>
      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <Input
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Enter new title"
            className="bg-gray-800 border-gray-700 text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSaveRename()
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsRenameDialogOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveRename}
              className="bg-emerald-500 text-black hover:bg-emerald-600"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
