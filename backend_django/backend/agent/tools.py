from google.genai import types


def get_tools_spec():
    return [
        types.FunctionDeclaration(
            name="list_services",
            description="Fetch all available services (doctors, consultants, etc.)",
            parameters={"type": "OBJECT", "properties": {}},
        ),
        types.FunctionDeclaration(
            name="check_availability",
            description="Get available slots for a service on a specific date.",
            parameters={
                "type": "OBJECT",
                "properties": {
                    "service_id": {"type": "INTEGER"},
                    "date": {"type": "STRING", "description": "YYYY-MM-DD"},
                },
                "required": ["service_id", "date"],
            },
        ),
        types.FunctionDeclaration(
            name="create_booking",
            description="Finalize a booking for a specific slot.",
            parameters={
                "type": "OBJECT",
                "properties": {
                    "slot_id": {"type": "INTEGER"},
                    "quantity": {"type": "INTEGER"},
                    "answers": {
                        "type": "OBJECT",
                        "description": "Key-value pairs for service questions",
                    },
                },
                "required": ["slot_id"],
            },
        ),
    ]
