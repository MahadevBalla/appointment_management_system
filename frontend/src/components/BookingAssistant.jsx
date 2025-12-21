import { useState } from 'react';
import { TextInput, Group, Text, Paper, ScrollArea, Button, Alert, Table, Card, Badge } from '@mantine/core';
import { Send, AlertCircle, ExternalLink, CheckCircle, Clock, Calendar } from 'lucide-react';
import api from '@/utils/api';

const BookingAssistant = ({ isVisible }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [context, setContext] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const openServiceInNewTab = (serviceId) => {
        window.open(`/customer/appointment/${serviceId}`, '_blank');
    };

    function formatAgentResponse(payload) {
        const { action, data } = payload;

        if (!data) return { type: 'text', content: "No data returned." };

        switch (action) {
            case "list_services":
                return {
                    type: 'services',
                    content: data
                };

            case "check_availability":
                if (!data.length) return { type: 'text', content: "No slots available for the selected date." };
                return {
                    type: 'availability',
                    content: data
                };

            case "create_booking":
                return {
                    type: 'booking',
                    content: data
                };

            case "create_payment_order":
                return {
                    type: 'payment',
                    content: data
                };

            default:
                return {
                    type: 'json',
                    content: data
                };
        }
    }

    const renderFormattedResponse = (formatted) => {
        switch (formatted.type) {
            case 'services':
                return (
                    <div className="space-y-3">
                        <Text size="sm" fw={600} className="text-teal-700">Available Services:</Text>
                        <div className="space-y-2">
                            {formatted.content.map((service) => (
                                <Card key={service.id} shadow="sm" p="md" withBorder className="hover:shadow-md transition-shadow">
                                    <Group justify="space-between" align="center">
                                        <div>
                                            <Text fw={600} size="md">{service.name}</Text>
                                            {service.description && (
                                                <Text size="xs" c="dimmed" className="mt-1">{service.description}</Text>
                                            )}
                                            {service.price && (
                                                <Text size="sm" c="teal" fw={500} className="mt-2">₹{service.price}</Text>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            color="teal"
                                            rightSection={<ExternalLink size={16} />}
                                            onClick={() => openServiceInNewTab(service.id)}
                                        >
                                            View Details
                                        </Button>
                                    </Group>
                                </Card>
                            ))}
                        </div>
                    </div>
                );

            case 'availability':
                return (
                    <div className="space-y-3">
                        <Text size="sm" fw={600} className="text-teal-700">Available Time Slots:</Text>
                        <Table striped highlightOnHover withTableBorder>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Time</Table.Th>
                                    <Table.Th>Status</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {formatted.content.map((slot, idx) => {
                                    const time = new Date(slot.start).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    });
                                    return (
                                        <Table.Tr key={idx}>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Clock size={16} className="text-gray-500" />
                                                    <Text size="sm" fw={500}>{time}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge
                                                    color={slot.available ? "green" : "red"}
                                                    variant="light"
                                                    leftSection={slot.available ? <CheckCircle size={14} /> : null}
                                                >
                                                    {slot.available ? "Available" : "Full"}
                                                </Badge>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                        <Text size="xs" c="dimmed" className="mt-2">
                            💡 To book a slot, say: "Book slot at [time]. Problem: [your issue], age: [your age]"
                        </Text>
                    </div>
                );

            case 'booking':
                return (
                    <Card shadow="md" p="lg" withBorder className="bg-green-50">
                        <div className="space-y-3">
                            <Group gap="xs" className="text-green-700">
                                <CheckCircle size={24} />
                                <Text size="lg" fw={700}>Booking Confirmed!</Text>
                            </Group>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Text size="sm" c="dimmed">Booking ID:</Text>
                                    <Text size="sm" fw={600} className="font-mono">{formatted.content.id}</Text>
                                </div>
                                {formatted.content.service_name && (
                                    <div className="flex justify-between items-center">
                                        <Text size="sm" c="dimmed">Service:</Text>
                                        <Text size="sm" fw={600}>{formatted.content.service_name}</Text>
                                    </div>
                                )}
                                {formatted.content.date && (
                                    <div className="flex justify-between items-center">
                                        <Text size="sm" c="dimmed">Date & Time:</Text>
                                        <Text size="sm" fw={600}>
                                            {new Date(formatted.content.date).toLocaleString()}
                                        </Text>
                                    </div>
                                )}
                            </div>
                            <Text size="xs" c="teal" fw={500} className="mt-4">
                                💡 Next step: Say "I want to pay now" to complete payment
                            </Text>
                        </div>
                    </Card>
                );

            case 'payment':
                return (
                    <Card shadow="md" p="lg" withBorder className="bg-blue-50">
                        <div className="space-y-3">
                            <Group gap="xs" className="text-blue-700">
                                <Calendar size={24} />
                                <Text size="lg" fw={700}>Payment Order Created</Text>
                            </Group>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Text size="sm" c="dimmed">Order ID:</Text>
                                    <Text size="sm" fw={600} className="font-mono">{formatted.content.order_id}</Text>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Text size="sm" c="dimmed">Amount:</Text>
                                    <Text size="lg" fw={700} c="blue">₹{(formatted.content.amount / 100).toFixed(2)}</Text>
                                </div>
                            </div>
                            <Text size="xs" c="blue" fw={500} className="mt-4">
                                ✅ Payment gateway will open automatically
                            </Text>
                        </div>
                    </Card>
                );

            case 'json':
                return (
                    <div className="space-y-2">
                        <Text size="sm" fw={600} className="text-teal-700">Response Data:</Text>
                        <Paper p="md" withBorder className="bg-gray-50">
                            <pre className="text-xs overflow-auto">
                                {JSON.stringify(formatted.content, null, 2)}
                            </pre>
                        </Paper>
                    </div>
                );

            case 'text':
            default:
                return <Text size="sm">{formatted.content}</Text>;
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        setMessages((m) => [...m, { role: "user", content: input }]);
        setInput("");
        setLoading(true);
        setError(null);

        try {
            const payload = await api.post("/agent/execute/", {
                message: input,
                context,
            });

            setContext(payload.context || {});

            if (payload.type === "question") {
                setMessages((m) => [...m, { role: "assistant", content: payload.message, isText: true }]);
                return;
            }

            const formatted = formatAgentResponse(payload);
            setMessages((m) => [
                ...m,
                { role: "assistant", formatted: formatted, isText: false },
            ]);
        } catch (err) {
            setError(err.response?.data?.detail || "Agent request failed");
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                <Text size="xl" fw={700}>
                    🩺 Appointment Booking Assistant
                </Text>
                <Text size="sm" className="opacity-90 mt-1">
                    Book appointments, check availability, and make payments effortlessly
                </Text>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6 bg-gray-50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Text size="lg" c="dimmed" fw={600} className="mb-4">
                            👋 Hi! I'm your booking assistant
                        </Text>
                        <div className="space-y-2 text-left max-w-md">
                            <Text size="sm" c="dimmed">Try asking me:</Text>
                            <Paper p="sm" withBorder className="bg-white">
                                <Text size="sm">• "I want to book an appointment"</Text>
                                <Text size="sm">• "Check availability for December 22"</Text>
                                <Text size="sm">• "Show me available services"</Text>
                            </Paper>
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <Paper
                            className={`p-4 max-w-[85%] ${msg.role === "user"
                                    ? "bg-teal-500 text-white"
                                    : "bg-white shadow-md"
                                }`}
                            shadow="sm"
                            radius="md"
                        >
                            <Text size="xs" fw={700} mb={6} className={msg.role === "user" ? "text-teal-100" : "text-teal-700"}>
                                {msg.role === "user" ? "You" : "🤖 Assistant"}
                            </Text>
                            {msg.isText ? (
                                <Text size="sm" className={msg.role === "user" ? "text-white" : ""}>
                                    {msg.content}
                                </Text>
                            ) : msg.role === "user" ? (
                                <Text size="sm" className="text-white">{msg.content}</Text>
                            ) : (
                                renderFormattedResponse(msg.formatted)
                            )}
                        </Paper>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <Paper className="p-4 bg-white shadow-md" radius="md">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <Text size="sm" c="dimmed">Processing your request...</Text>
                            </div>
                        </Paper>
                    </div>
                )}

                {error && (
                    <Alert color="red" icon={<AlertCircle size={16} />} className="mb-4">
                        {error}
                    </Alert>
                )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
                <Group gap="sm">
                    <TextInput
                        className="flex-1"
                        placeholder="Type your message... (e.g., 'I want to book an appointment')"
                        value={input}
                        disabled={loading}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        size="md"
                        styles={{
                            input: {
                                borderColor: '#14b8a6',
                                '&:focus': {
                                    borderColor: '#0d9488',
                                }
                            }
                        }}
                    />
                    <Button
                        onClick={sendMessage}
                        loading={loading}
                        size="md"
                        color="teal"
                        leftSection={<Send size={18} />}
                    >
                        Send
                    </Button>
                </Group>
            </div>
        </div>
    );
};

export default BookingAssistant; 