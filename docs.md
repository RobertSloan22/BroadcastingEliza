Class: abstract DatabaseAdapter<DB>
An abstract class representing a database adapter for managing various entities like accounts, memories, actors, goals, and rooms.

Type Parameters
• DB = any

Implements
IDatabaseAdapter
Constructors
new DatabaseAdapter()
new DatabaseAdapter<DB>(circuitBreakerConfig?): DatabaseAdapter<DB>

Creates a new DatabaseAdapter instance with optional circuit breaker configuration.

Parameters
• circuitBreakerConfig?

Configuration options for the circuit breaker

• circuitBreakerConfig.failureThreshold?: number

Number of failures before circuit opens (defaults to 5)

• circuitBreakerConfig.resetTimeout?: number

Time in ms before attempting to close circuit (defaults to 60000)

• circuitBreakerConfig.halfOpenMaxAttempts?: number

Number of successful attempts needed to close circuit (defaults to 3)

Returns
DatabaseAdapter<DB>

Defined in
packages/core/src/database.ts:46

Properties
db
db: DB

The database instance.

Implementation of
IDatabaseAdapter.db

Defined in
packages/core/src/database.ts:23

circuitBreaker
protected circuitBreaker: CircuitBreaker

Circuit breaker instance used to handle fault tolerance and prevent cascading failures. Implements the Circuit Breaker pattern to temporarily disable operations when a failure threshold is reached.

The circuit breaker has three states:

CLOSED: Normal operation, requests pass through
OPEN: Failure threshold exceeded, requests are blocked
HALF_OPEN: Testing if service has recovered
Defined in
packages/core/src/database.ts:36

Methods
init()
abstract init(): Promise<void>

Optional initialization method for the database adapter.

Returns
Promise<void>

A Promise that resolves when initialization is complete.

Implementation of
IDatabaseAdapter.init

Defined in
packages/core/src/database.ts:58

close()
abstract close(): Promise<void>

Optional close method for the database adapter.

Returns
Promise<void>

A Promise that resolves when closing is complete.

Implementation of
IDatabaseAdapter.close

Defined in
packages/core/src/database.ts:64

getAccountById()
abstract getAccountById(userId): Promise<Account>

Retrieves an account by its ID.

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the user account to retrieve.

Returns
Promise<Account>

A Promise that resolves to the Account object or null if not found.

Implementation of
IDatabaseAdapter.getAccountById

Defined in
packages/core/src/database.ts:71

createAccount()
abstract createAccount(account): Promise<boolean>

Creates a new account in the database.

Parameters
• account: Account

The account object to create.

Returns
Promise<boolean>

A Promise that resolves when the account creation is complete.

Implementation of
IDatabaseAdapter.createAccount

Defined in
packages/core/src/database.ts:78

getMemories()
abstract getMemories(params): Promise<Memory[]>

Retrieves memories based on the specified parameters.

Parameters
• params

An object containing parameters for the memory retrieval.

• params.agentId: `${string}-${string}-${string}-${string}-${string}`

• params.roomId: `${string}-${string}-${string}-${string}-${string}`

• params.count?: number

• params.unique?: boolean

• params.tableName: string

Returns
Promise<Memory[]>

A Promise that resolves to an array of Memory objects.

Implementation of
IDatabaseAdapter.getMemories

Defined in
packages/core/src/database.ts:85

getMemoriesByRoomIds()
abstract getMemoriesByRoomIds(params): Promise<Memory[]>

Parameters
• params

• params.agentId: `${string}-${string}-${string}-${string}-${string}`

• params.roomIds: `${string}-${string}-${string}-${string}-${string}`[]

• params.tableName: string

Returns
Promise<Memory[]>

Implementation of
IDatabaseAdapter.getMemoriesByRoomIds

Defined in
packages/core/src/database.ts:93

getMemoryById()
abstract getMemoryById(id): Promise<Memory>

Parameters
• id: `${string}-${string}-${string}-${string}-${string}`

Returns
Promise<Memory>

Implementation of
IDatabaseAdapter.getMemoryById

Defined in
packages/core/src/database.ts:99

getCachedEmbeddings()
abstract getCachedEmbeddings(params): Promise<object[]>

Retrieves cached embeddings based on the specified query parameters.

Parameters
• params

An object containing parameters for the embedding retrieval.

• params.query_table_name: string

• params.query_threshold: number

• params.query_input: string

• params.query_field_name: string

• params.query_field_sub_name: string

• params.query_match_count: number

Returns
Promise<object[]>

A Promise that resolves to an array of objects containing embeddings and levenshtein scores.

Implementation of
IDatabaseAdapter.getCachedEmbeddings

Defined in
packages/core/src/database.ts:106

log()
abstract log(params): Promise<void>

Logs an event or action with the specified details.

Parameters
• params

An object containing parameters for the log entry.

• params.body

• params.userId: `${string}-${string}-${string}-${string}-${string}`

• params.roomId: `${string}-${string}-${string}-${string}-${string}`

• params.type: string

Returns
Promise<void>

A Promise that resolves when the log entry has been saved.

Implementation of
IDatabaseAdapter.log

Defined in
packages/core/src/database.ts:132

getActorDetails()
abstract getActorDetails(params): Promise<Actor[]>

Retrieves details of actors in a given room.

Parameters
• params

An object containing the roomId to search for actors.

• params.roomId: `${string}-${string}-${string}-${string}-${string}`

Returns
Promise<Actor[]>

A Promise that resolves to an array of Actor objects.

Implementation of
IDatabaseAdapter.getActorDetails

Defined in
packages/core/src/database.ts:144

searchMemories()
abstract searchMemories(params): Promise<Memory[]>

Searches for memories based on embeddings and other specified parameters.

Parameters
• params

An object containing parameters for the memory search.

• params.tableName: string

• params.agentId: `${string}-${string}-${string}-${string}-${string}`

• params.roomId: `${string}-${string}-${string}-${string}-${string}`

• params.embedding: number[]

• params.match_threshold: number

• params.match_count: number

• params.unique: boolean

Returns
Promise<Memory[]>

A Promise that resolves to an array of Memory objects.

Implementation of
IDatabaseAdapter.searchMemories

Defined in
packages/core/src/database.ts:151

updateGoalStatus()
abstract updateGoalStatus(params): Promise<void>

Updates the status of a specific goal.

Parameters
• params

An object containing the goalId and the new status.

• params.goalId: `${string}-${string}-${string}-${string}-${string}`

• params.status: GoalStatus

Returns
Promise<void>

A Promise that resolves when the goal status has been updated.

Implementation of
IDatabaseAdapter.updateGoalStatus

Defined in
packages/core/src/database.ts:166

searchMemoriesByEmbedding()
abstract searchMemoriesByEmbedding(embedding, params): Promise<Memory[]>

Searches for memories by embedding and other specified parameters.

Parameters
• embedding: number[]

The embedding vector to search with.

• params

Additional parameters for the search.

• params.match_threshold?: number

• params.count?: number

• params.roomId?: `${string}-${string}-${string}-${string}-${string}`

• params.agentId?: `${string}-${string}-${string}-${string}-${string}`

• params.unique?: boolean

• params.tableName: string

Returns
Promise<Memory[]>

A Promise that resolves to an array of Memory objects.

Implementation of
IDatabaseAdapter.searchMemoriesByEmbedding

Defined in
packages/core/src/database.ts:177

createMemory()
abstract createMemory(memory, tableName, unique?): Promise<void>

Creates a new memory in the database.

Parameters
• memory: Memory

The memory object to create.

• tableName: string

The table where the memory should be stored.

• unique?: boolean

Indicates if the memory should be unique.

Returns
Promise<void>

A Promise that resolves when the memory has been created.

Implementation of
IDatabaseAdapter.createMemory

Defined in
packages/core/src/database.ts:196

removeMemory()
abstract removeMemory(memoryId, tableName): Promise<void>

Removes a specific memory from the database.

Parameters
• memoryId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the memory to remove.

• tableName: string

The table from which the memory should be removed.

Returns
Promise<void>

A Promise that resolves when the memory has been removed.

Implementation of
IDatabaseAdapter.removeMemory

Defined in
packages/core/src/database.ts:208

removeAllMemories()
abstract removeAllMemories(roomId, tableName): Promise<void>

Removes all memories associated with a specific room.

Parameters
• roomId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the room whose memories should be removed.

• tableName: string

The table from which the memories should be removed.

Returns
Promise<void>

A Promise that resolves when all memories have been removed.

Implementation of
IDatabaseAdapter.removeAllMemories

Defined in
packages/core/src/database.ts:216

countMemories()
abstract countMemories(roomId, unique?, tableName?): Promise<number>

Counts the number of memories in a specific room.

Parameters
• roomId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the room for which to count memories.

• unique?: boolean

Specifies whether to count only unique memories.

• tableName?: string

Optional table name to count memories from.

Returns
Promise<number>

A Promise that resolves to the number of memories.

Implementation of
IDatabaseAdapter.countMemories

Defined in
packages/core/src/database.ts:225

getGoals()
abstract getGoals(params): Promise<Goal[]>

Retrieves goals based on specified parameters.

Parameters
• params

An object containing parameters for goal retrieval.

• params.agentId: `${string}-${string}-${string}-${string}-${string}`

• params.roomId: `${string}-${string}-${string}-${string}-${string}`

• params.userId?: `${string}-${string}-${string}-${string}-${string}`

• params.onlyInProgress?: boolean

• params.count?: number

Returns
Promise<Goal[]>

A Promise that resolves to an array of Goal objects.

Implementation of
IDatabaseAdapter.getGoals

Defined in
packages/core/src/database.ts:236

updateGoal()
abstract updateGoal(goal): Promise<void>

Updates a specific goal in the database.

Parameters
• goal: Goal

The goal object with updated properties.

Returns
Promise<void>

A Promise that resolves when the goal has been updated.

Implementation of
IDatabaseAdapter.updateGoal

Defined in
packages/core/src/database.ts:249

createGoal()
abstract createGoal(goal): Promise<void>

Creates a new goal in the database.

Parameters
• goal: Goal

The goal object to create.

Returns
Promise<void>

A Promise that resolves when the goal has been created.

Implementation of
IDatabaseAdapter.createGoal

Defined in
packages/core/src/database.ts:256

removeGoal()
abstract removeGoal(goalId): Promise<void>

Removes a specific goal from the database.

Parameters
• goalId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the goal to remove.

Returns
Promise<void>

A Promise that resolves when the goal has been removed.

Implementation of
IDatabaseAdapter.removeGoal

Defined in
packages/core/src/database.ts:263

removeAllGoals()
abstract removeAllGoals(roomId): Promise<void>

Removes all goals associated with a specific room.

Parameters
• roomId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the room whose goals should be removed.

Returns
Promise<void>

A Promise that resolves when all goals have been removed.

Implementation of
IDatabaseAdapter.removeAllGoals

Defined in
packages/core/src/database.ts:270

getRoom()
abstract getRoom(roomId): Promise<`${string}-${string}-${string}-${string}-${string}`>

Retrieves the room ID for a given room, if it exists.

Parameters
• roomId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the room to retrieve.

Returns
Promise<`${string}-${string}-${string}-${string}-${string}`>

A Promise that resolves to the room ID or null if not found.

Implementation of
IDatabaseAdapter.getRoom

Defined in
packages/core/src/database.ts:277

createRoom()
abstract createRoom(roomId?): Promise<`${string}-${string}-${string}-${string}-${string}`>

Creates a new room with an optional specified ID.

Parameters
• roomId?: `${string}-${string}-${string}-${string}-${string}`

Optional UUID to assign to the new room.

Returns
Promise<`${string}-${string}-${string}-${string}-${string}`>

A Promise that resolves to the UUID of the created room.

Implementation of
IDatabaseAdapter.createRoom

Defined in
packages/core/src/database.ts:284

removeRoom()
abstract removeRoom(roomId): Promise<void>

Removes a specific room from the database.

Parameters
• roomId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the room to remove.

Returns
Promise<void>

A Promise that resolves when the room has been removed.

Implementation of
IDatabaseAdapter.removeRoom

Defined in
packages/core/src/database.ts:291

getRoomsForParticipant()
abstract getRoomsForParticipant(userId): Promise<`${string}-${string}-${string}-${string}-${string}`[]>

Retrieves room IDs for which a specific user is a participant.

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the user.

Returns
Promise<`${string}-${string}-${string}-${string}-${string}`[]>

A Promise that resolves to an array of room IDs.

Implementation of
IDatabaseAdapter.getRoomsForParticipant

Defined in
packages/core/src/database.ts:298

getRoomsForParticipants()
abstract getRoomsForParticipants(userIds): Promise<`${string}-${string}-${string}-${string}-${string}`[]>

Retrieves room IDs for which specific users are participants.

Parameters
• userIds: `${string}-${string}-${string}-${string}-${string}`[]

An array of UUIDs of the users.

Returns
Promise<`${string}-${string}-${string}-${string}-${string}`[]>

A Promise that resolves to an array of room IDs.

Implementation of
IDatabaseAdapter.getRoomsForParticipants

Defined in
packages/core/src/database.ts:305

addParticipant()
abstract addParticipant(userId, roomId): Promise<boolean>

Adds a user as a participant to a specific room.

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the user to add as a participant.

• roomId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the room to which the user will be added.

Returns
Promise<boolean>

A Promise that resolves to a boolean indicating success or failure.

Implementation of
IDatabaseAdapter.addParticipant

Defined in
packages/core/src/database.ts:313

removeParticipant()
abstract removeParticipant(userId, roomId): Promise<boolean>

Removes a user as a participant from a specific room.

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the user to remove as a participant.

• roomId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the room from which the user will be removed.

Returns
Promise<boolean>

A Promise that resolves to a boolean indicating success or failure.

Implementation of
IDatabaseAdapter.removeParticipant

Defined in
packages/core/src/database.ts:321

getParticipantsForAccount()
getParticipantsForAccount(userId)
abstract getParticipantsForAccount(userId): Promise<Participant[]>

Retrieves participants associated with a specific account.

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the account.

Returns
Promise<Participant[]>

A Promise that resolves to an array of Participant objects.

Implementation of
IDatabaseAdapter.getParticipantsForAccount

Defined in
packages/core/src/database.ts:328

getParticipantsForAccount(userId)
abstract getParticipantsForAccount(userId): Promise<Participant[]>

Retrieves participants associated with a specific account.

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the account.

Returns
Promise<Participant[]>

A Promise that resolves to an array of Participant objects.

Implementation of
IDatabaseAdapter.getParticipantsForAccount

Defined in
packages/core/src/database.ts:335

getParticipantsForRoom()
abstract getParticipantsForRoom(roomId): Promise<`${string}-${string}-${string}-${string}-${string}`[]>

Retrieves participants for a specific room.

Parameters
• roomId: `${string}-${string}-${string}-${string}-${string}`

The UUID of the room for which to retrieve participants.

Returns
Promise<`${string}-${string}-${string}-${string}-${string}`[]>

A Promise that resolves to an array of UUIDs representing the participants.

Implementation of
IDatabaseAdapter.getParticipantsForRoom

Defined in
packages/core/src/database.ts:342

getParticipantUserState()
abstract getParticipantUserState(roomId, userId): Promise<"FOLLOWED" | "MUTED">

Parameters
• roomId: `${string}-${string}-${string}-${string}-${string}`

• userId: `${string}-${string}-${string}-${string}-${string}`

Returns
Promise<"FOLLOWED" | "MUTED">

Implementation of
IDatabaseAdapter.getParticipantUserState

Defined in
packages/core/src/database.ts:344

setParticipantUserState()
abstract setParticipantUserState(roomId, userId, state): Promise<void>

Parameters
• roomId: `${string}-${string}-${string}-${string}-${string}`

• userId: `${string}-${string}-${string}-${string}-${string}`

• state: "FOLLOWED" | "MUTED"

Returns
Promise<void>

Implementation of
IDatabaseAdapter.setParticipantUserState

Defined in
packages/core/src/database.ts:348

createRelationship()
abstract createRelationship(params): Promise<boolean>

Creates a new relationship between two users.

Parameters
• params

An object containing the UUIDs of the two users (userA and userB).

• params.userA: `${string}-${string}-${string}-${string}-${string}`

• params.userB: `${string}-${string}-${string}-${string}-${string}`

Returns
Promise<boolean>

A Promise that resolves to a boolean indicating success or failure of the creation.

Implementation of
IDatabaseAdapter.createRelationship

Defined in
packages/core/src/database.ts:359

getRelationship()
abstract getRelationship(params): Promise<Relationship>

Retrieves a relationship between two users if it exists.

Parameters
• params

An object containing the UUIDs of the two users (userA and userB).

• params.userA: `${string}-${string}-${string}-${string}-${string}`

• params.userB: `${string}-${string}-${string}-${string}-${string}`

Returns
Promise<Relationship>

A Promise that resolves to the Relationship object or null if not found.

Implementation of
IDatabaseAdapter.getRelationship

Defined in
packages/core/src/database.ts:369

getRelationships()
abstract getRelationships(params): Promise<Relationship[]>

Retrieves all relationships for a specific user.

Parameters
• params

An object containing the UUID of the user.

• params.userId: `${string}-${string}-${string}-${string}-${string}`

Returns
Promise<Relationship[]>

A Promise that resolves to an array of Relationship objects.

Implementation of
IDatabaseAdapter.getRelationships

Defined in
packages/core/src/database.ts:379

withCircuitBreaker()
protected withCircuitBreaker<T>(operation, context): Promise<T>

Executes an operation with circuit breaker protection.

Type Parameters
• T

Parameters
• operation

A function that returns a Promise to be executed with circuit breaker protection

• context: string

A string describing the context/operation being performed for logging purposes

Returns
Promise<T>

A Promise that resolves to the result of the operation

Throws
Will throw an error if the circuit breaker is open or if the operation fails

Defined in
packages/core/src/database.ts:391




Class: AgentRuntime
Represents the runtime environment for an agent, handling message processing, action registration, and interaction with external services like OpenAI and Supabase.

Implements
IAgentRuntime
Constructors
new AgentRuntime()
new AgentRuntime(opts): AgentRuntime

Creates an instance of AgentRuntime.

Parameters
• opts

The options for configuring the AgentRuntime.

• opts.conversationLength?: number

The number of messages to hold in the recent message cache.

• opts.agentId?: `${string}-${string}-${string}-${string}-${string}`

Optional ID of the agent.

• opts.character?: Character

• opts.token: string

The JWT token, can be a JWT token if outside worker, or an OpenAI token if inside worker.

• opts.serverUrl?: string

The URL of the worker.

• opts.actions?: Action[]

Optional custom actions.

• opts.evaluators?: Evaluator[]

Optional custom evaluators.

• opts.plugins?: Plugin[]

• opts.providers?: Provider[]

Optional context providers.

• opts.modelProvider: ModelProviderName

• opts.services?: Service[]

Optional custom services.

• opts.managers?: IMemoryManager[]

• opts.databaseAdapter: IDatabaseAdapter

The database adapter used for interacting with the database.

• opts.fetch?: unknown

Custom fetch function to use for making requests.

• opts.speechModelPath?: string

• opts.cacheManager: ICacheManager

• opts.logging?: boolean

Returns
AgentRuntime

Defined in
packages/core/src/runtime.ts:215

Properties
agentId
agentId: `${string}-${string}-${string}-${string}-${string}`

The ID of the agent

Implementation of
IAgentRuntime.agentId

Defined in
packages/core/src/runtime.ts:63

serverUrl
serverUrl: string = "http://localhost:7998"

The base URL of the server where the agent's requests are processed.

Implementation of
IAgentRuntime.serverUrl

Defined in
packages/core/src/runtime.ts:67

databaseAdapter
databaseAdapter: IDatabaseAdapter

The database adapter used for interacting with the database.

Implementation of
IAgentRuntime.databaseAdapter

Defined in
packages/core/src/runtime.ts:72

token
token: string

Authentication token used for securing requests.

Implementation of
IAgentRuntime.token

Defined in
packages/core/src/runtime.ts:77

actions
actions: Action[] = []

Custom actions that the agent can perform.

Implementation of
IAgentRuntime.actions

Defined in
packages/core/src/runtime.ts:82

evaluators
evaluators: Evaluator[] = []

Evaluators used to assess and guide the agent's responses.

Implementation of
IAgentRuntime.evaluators

Defined in
packages/core/src/runtime.ts:87

providers
providers: Provider[] = []

Context providers used to provide context for message generation.

Implementation of
IAgentRuntime.providers

Defined in
packages/core/src/runtime.ts:92

plugins
plugins: Plugin[] = []

Implementation of
IAgentRuntime.plugins

Defined in
packages/core/src/runtime.ts:94

modelProvider
modelProvider: ModelProviderName

The model to use for generateText.

Implementation of
IAgentRuntime.modelProvider

Defined in
packages/core/src/runtime.ts:99

imageModelProvider
imageModelProvider: ModelProviderName

The model to use for generateImage.

Implementation of
IAgentRuntime.imageModelProvider

Defined in
packages/core/src/runtime.ts:104

imageVisionModelProvider
imageVisionModelProvider: ModelProviderName

The model to use for describing images.

Implementation of
IAgentRuntime.imageVisionModelProvider

Defined in
packages/core/src/runtime.ts:110

fetch()
fetch: (input, init?) => Promise<Response>

Fetch function to use Some environments may not have access to the global fetch function and need a custom fetch override.

MDN Reference

Parameters
• input: RequestInfo | URL

• init?: RequestInit

Returns
Promise<Response>

Implementation of
IAgentRuntime.fetch

Defined in
packages/core/src/runtime.ts:116

character
character: Character

The character to use for the agent

Implementation of
IAgentRuntime.character

Defined in
packages/core/src/runtime.ts:121

messageManager
messageManager: IMemoryManager

Store messages that are sent and received by the agent.

Implementation of
IAgentRuntime.messageManager

Defined in
packages/core/src/runtime.ts:126

descriptionManager
descriptionManager: IMemoryManager

Store and recall descriptions of users based on conversations.

Implementation of
IAgentRuntime.descriptionManager

Defined in
packages/core/src/runtime.ts:131

loreManager
loreManager: IMemoryManager

Manage the creation and recall of static information (documents, historical game lore, etc)

Implementation of
IAgentRuntime.loreManager

Defined in
packages/core/src/runtime.ts:136

documentsManager
documentsManager: IMemoryManager

Hold large documents that can be referenced

Implementation of
IAgentRuntime.documentsManager

Defined in
packages/core/src/runtime.ts:141

knowledgeManager
knowledgeManager: IMemoryManager

Searchable document fragments

Implementation of
IAgentRuntime.knowledgeManager

Defined in
packages/core/src/runtime.ts:146

services
services: Map<ServiceType, Service>

Implementation of
IAgentRuntime.services

Defined in
packages/core/src/runtime.ts:148

memoryManagers
memoryManagers: Map<string, IMemoryManager>

Defined in
packages/core/src/runtime.ts:149

cacheManager
cacheManager: ICacheManager

Implementation of
IAgentRuntime.cacheManager

Defined in
packages/core/src/runtime.ts:150

clients
clients: Record<string, any>

any could be EventEmitter but I think the real solution is forthcoming as a base client interface

Implementation of
IAgentRuntime.clients

Defined in
packages/core/src/runtime.ts:151

Methods
registerMemoryManager()
registerMemoryManager(manager): void

Parameters
• manager: IMemoryManager

Returns
void

Implementation of
IAgentRuntime.registerMemoryManager

Defined in
packages/core/src/runtime.ts:153

getMemoryManager()
getMemoryManager(tableName): IMemoryManager

Parameters
• tableName: string

Returns
IMemoryManager

Implementation of
IAgentRuntime.getMemoryManager

Defined in
packages/core/src/runtime.ts:168

getService()
getService<T>(service): T

Type Parameters
• T extends Service

Parameters
• service: ServiceType

Returns
T

Implementation of
IAgentRuntime.getService

Defined in
packages/core/src/runtime.ts:172

registerService()
registerService(service): Promise<void>

Parameters
• service: Service

Returns
Promise<void>

Implementation of
IAgentRuntime.registerService

Defined in
packages/core/src/runtime.ts:181

initialize()
initialize(): Promise<void>

Returns
Promise<void>

Implementation of
IAgentRuntime.initialize

Defined in
packages/core/src/runtime.ts:395

stop()
stop(): Promise<void>

Returns
Promise<void>

Defined in
packages/core/src/runtime.ts:428

getSetting()
getSetting(key): any

Parameters
• key: string

Returns
any

Implementation of
IAgentRuntime.getSetting

Defined in
packages/core/src/runtime.ts:478

getConversationLength()
getConversationLength(): number

Get the number of messages that are kept in the conversation buffer.

Returns
number

The number of recent messages to be kept in memory.

Implementation of
IAgentRuntime.getConversationLength

Defined in
packages/core/src/runtime.ts:500

registerAction()
registerAction(action): void

Register an action for the agent to perform.

Parameters
• action: Action

The action to register.

Returns
void

Implementation of
IAgentRuntime.registerAction

Defined in
packages/core/src/runtime.ts:508

registerEvaluator()
registerEvaluator(evaluator): void

Register an evaluator to assess and guide the agent's responses.

Parameters
• evaluator: Evaluator

The evaluator to register.

Returns
void

Defined in
packages/core/src/runtime.ts:517

registerContextProvider()
registerContextProvider(provider): void

Register a context provider to provide context for message generation.

Parameters
• provider: Provider

The context provider to register.

Returns
void

Defined in
packages/core/src/runtime.ts:525

processActions()
processActions(message, responses, state?, callback?): Promise<void>

Process the actions of a message.

Parameters
• message: Memory

The message to process.

• responses: Memory[]

• state?: State

• callback?: HandlerCallback

Returns
Promise<void>

Implementation of
IAgentRuntime.processActions

Defined in
packages/core/src/runtime.ts:534

evaluate()
evaluate(message, state?, didRespond?, callback?): Promise<string[]>

Evaluate the message and state using the registered evaluators.

Parameters
• message: Memory

The message to evaluate.

• state?: State

The state of the agent.

• didRespond?: boolean

Whether the agent responded to the message.~

• callback?: HandlerCallback

The handler callback

Returns
Promise<string[]>

The results of the evaluation.

Implementation of
IAgentRuntime.evaluate

Defined in
packages/core/src/runtime.ts:618

ensureParticipantExists()
ensureParticipantExists(userId, roomId): Promise<void>

Ensure the existence of a participant in the room. If the participant does not exist, they are added to the room.

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

The user ID to ensure the existence of.

• roomId: `${string}-${string}-${string}-${string}-${string}`

Returns
Promise<void>

Throws
An error if the participant cannot be added.

Implementation of
IAgentRuntime.ensureParticipantExists

Defined in
packages/core/src/runtime.ts:685

ensureUserExists()
ensureUserExists(userId, userName, name, email?, source?): Promise<void>

Ensure the existence of a user in the database. If the user does not exist, they are added to the database.

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

The user ID to ensure the existence of.

• userName: string

The user name to ensure the existence of.

• name: string

• email?: string

• source?: string

Returns
Promise<void>

Implementation of
IAgentRuntime.ensureUserExists

Defined in
packages/core/src/runtime.ts:701

ensureParticipantInRoom()
ensureParticipantInRoom(userId, roomId): Promise<void>

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

• roomId: `${string}-${string}-${string}-${string}-${string}`

Returns
Promise<void>

Implementation of
IAgentRuntime.ensureParticipantInRoom

Defined in
packages/core/src/runtime.ts:721

ensureConnection()
ensureConnection(userId, roomId, userName?, userScreenName?, source?): Promise<void>

Parameters
• userId: `${string}-${string}-${string}-${string}-${string}`

• roomId: `${string}-${string}-${string}-${string}-${string}`

• userName?: string

• userScreenName?: string

• source?: string

Returns
Promise<void>

Implementation of
IAgentRuntime.ensureConnection

Defined in
packages/core/src/runtime.ts:738

ensureRoomExists()
ensureRoomExists(roomId): Promise<void>

Ensure the existence of a room between the agent and a user. If no room exists, a new room is created and the user and agent are added as participants. The room ID is returned.

Parameters
• roomId: `${string}-${string}-${string}-${string}-${string}`

Returns
Promise<void>

The room ID of the room between the agent and the user.

Throws
An error if the room cannot be created.

Implementation of
IAgentRuntime.ensureRoomExists

Defined in
packages/core/src/runtime.ts:774

composeState()
composeState(message, additionalKeys): Promise<State>

Compose the state of the agent into an object that can be passed or used for response generation.

Parameters
• message: Memory

The message to compose the state from.

• additionalKeys = {}

Returns
Promise<State>

The state of the agent.

Implementation of
IAgentRuntime.composeState

Defined in
packages/core/src/runtime.ts:787

updateRecentMessageState()
updateRecentMessageState(state): Promise<State>

Parameters
• state: State

Returns
Promise<State>

Implementation of
IAgentRuntime.updateRecentMessageState

Defined in
packages/core/src/runtime.ts:1233

Class: CacheManager<CacheAdapter>
Type Parameters
• CacheAdapter extends ICacheAdapter = ICacheAdapter

Implements
ICacheManager
Constructors
new CacheManager()
new CacheManager<CacheAdapter>(adapter): CacheManager<CacheAdapter>

Parameters
• adapter: CacheAdapter

Returns
CacheManager<CacheAdapter>

Defined in
packages/core/src/cache.ts:93

Properties
adapter
adapter: CacheAdapter

Defined in
packages/core/src/cache.ts:91

Methods
get()
get<T>(key): Promise<T>

Type Parameters
• T = unknown

Parameters
• key: string

Returns
Promise<T>

Implementation of
ICacheManager.get

Defined in
packages/core/src/cache.ts:97

set()
set<T>(key, value, opts?): Promise<void>

Type Parameters
• T

Parameters
• key: string

• value: T

• opts?: CacheOptions

Returns
Promise<void>

Implementation of
ICacheManager.set

Defined in
packages/core/src/cache.ts:116

delete()
delete(key): Promise<void>

Parameters
• key: string

Returns
Promise<void>

Implementation of
ICacheManager.delete

Defined in
packages/core/src/cache.ts:123

Class: DbCacheAdapter
Implements
ICacheAdapter
Constructors
new DbCacheAdapter()
new DbCacheAdapter(db, agentId): DbCacheAdapter

Parameters
• db: IDatabaseCacheAdapter

• agentId: `${string}-${string}-${string}-${string}-${string}`

Returns
DbCacheAdapter

Defined in
packages/core/src/cache.ts:70

Methods
get()
get(key): Promise<string>

Parameters
• key: string

Returns
Promise<string>

Implementation of
ICacheAdapter.get

Defined in
packages/core/src/cache.ts:75

set()
set(key, value): Promise<void>

Parameters
• key: string

• value: string

Returns
Promise<void>

Implementation of
ICacheAdapter.set

Defined in
packages/core/src/cache.ts:79

delete()
delete(key): Promise<void>

Parameters
• key: string

Returns
Promise<void>

Implementation of
ICacheAdapter.delete

Defined in
packages/core/src/cache.ts:83

Previous
DatabaseAdapter
Next
FsCacheAdapter
Implements
Constructors
new DbCacheAdapter()
Methods
get()
set()
del




Class: FsCacheAdapter
Implements
ICacheAdapter
Constructors
new FsCacheAdapter()
new FsCacheAdapter(dataDir): FsCacheAdapter

Parameters
• dataDir: string

Returns
FsCacheAdapter

Defined in
packages/core/src/cache.ts:37

Methods
get()
get(key): Promise<string>

Parameters
• key: string

Returns
Promise<string>

Implementation of
ICacheAdapter.get

Defined in
packages/core/src/cache.ts:39

set()
set(key, value): Promise<void>

Parameters
• key: string

• value: string

Returns
Promise<void>

Implementation of
ICacheAdapter.set

Defined in
packages/core/src/cache.ts:48

delete()
delete(key): Promise<void>

Parameters
• key: string

Returns
Promise<void>

Implementation of
ICacheAdapter.delete

Defined in
packages/core/src/cache.ts:59

Previous
DbCacheAdapter
Next
MemoryCacheAdapter
Implements
Constructors
new FsCacheAdapter()
Methods
get()
set()
delete()
Docs
General
Community
Discord
Twitter