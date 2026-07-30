from langgraph.graph import StateGraph, START, END
from app.agents.state import ResearchState
from app.agents.planner import planner_node
from app.agents.researcher import researcher_node
from app.agents.critic import critic_node
from app.agents.synthesizer import synthesizer_node
from app.core.logging import logger


def route_after_critic(state: ResearchState) -> str:
    """Conditional router following Critic node verdict."""
    verdict = state.get("critic_verdict", "APPROVED")
    if verdict == "REJECTED":
        logger.info("[Graph] Router: Re-routing to 'researcher' node for additional data collection loop.")
        return "researcher"
    logger.info("[Graph] Router: Routing to 'synthesizer' node for report generation.")
    return "synthesizer"


def build_research_graph() -> StateGraph:
    """Compiles the LangGraph multi-agent self-correcting workflow graph."""
    workflow = StateGraph(ResearchState)

    # Add Agent Nodes
    workflow.add_node("planner", planner_node.execute)
    workflow.add_node("researcher", researcher_node.execute)
    workflow.add_node("critic", critic_node.execute)
    workflow.add_node("synthesizer", synthesizer_node.execute)

    # Define Workflow Edges
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "researcher")
    workflow.add_edge("researcher", "critic")

    # Conditional Routing
    workflow.add_conditional_edges(
        "critic",
        route_after_critic,
        {
            "researcher": "researcher",
            "synthesizer": "synthesizer",
        }
    )

    workflow.add_edge("synthesizer", END)

    compiled_graph = workflow.compile()
    logger.info("Successfully compiled DeepFetch AI LangGraph State Machine.")
    return compiled_graph


research_graph = build_research_graph()
