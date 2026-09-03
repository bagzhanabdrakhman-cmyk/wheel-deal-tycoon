# Wheel Deal Tycoon

Upgrade the game into a FREE-ROAM 3D CAR FLIPPING + DRIVING SIMULATOR.

The player must be able to actually DRIVE the cars, not just view them in cards.

CORE GAMEPLAY

The game is a used-car flipping simulator.

The player:

BUY CAR → ENTER CAR → DRIVE → INSPECT → REPAIR → CUSTOMIZE → SELL → BUY ANOTHER CAR.

Everything must be playable.

FREE DRIVING

Create a real third-person/first-person driving system.

The player can:

Enter the car

Start the engine

Accelerate

Brake

Reverse

Turn left/right

Drive around freely

Exit the car

Park the car

Explore the city

Desktop controls:

W = Gas
S = Brake / Reverse
A = Turn left
D = Turn right
Space = Handbrake
E = Enter / Exit vehicle
F = Start engine
C = Change camera

Add multiple camera modes:

Third person

Hood camera

First-person interior camera

MOBILE CONTROLS

Make the game fully playable on Android/mobile.

Add:

Virtual steering wheel OR left/right steering buttons

Gas pedal

Brake pedal

Handbrake

Enter/Exit button

Camera button

Controls must be smooth and responsive.

PHYSICS

Cars must have basic realistic physics.

Implement:

Acceleration

Braking

Steering

Weight

Friction

Drifting

Collisions

Suspension movement

Wheel rotation

Cars should feel different.

Example:

BMW M4:
Fast acceleration and sporty handling.

Toyota Camry:
Slower but stable.

Porsche 911:
Very fast and responsive.

Old damaged car:
Poor acceleration and handling.

OPEN WORLD

Create a small but beautiful free-roam city.

Include:

Roads

Intersections

Traffic lights

Buildings

Gas station

Car dealership

Repair shop

Used-car market

Player garage

Parking lots

Highway

The map does NOT need to be huge.

Make a smaller map with good graphics and smooth performance.

DAY / NIGHT

Create a day/night cycle.

Morning
Day
Evening
Night

Add:

Street lights

Headlights

Sunset

Night city lighting

WEATHER

Add simple weather:

Sunny
Rain

Rain should make roads slightly slippery.

CARS

Include several playable vehicles:

BMW M4
Mercedes C63
Audi RS5
Nissan GT-R
Toyota Supra
Porsche 911
Ford Mustang
Toyota Camry
Honda Civic Type R
Volkswagen Golf GTI

Each car should have different:

Speed

Acceleration

Handling

Braking

Price

BUYING CARS

The player starts with:

$10,000

The player can visit the used-car market and purchase vehicles.

After buying a car:

Show:

"CAR PURCHASED"

The car becomes available in the player's garage.

GARAGE

Create a beautiful 3D garage.

The player can:

See owned cars

Enter a car

Drive out of garage

Repair

Customize

Sell

CAR CONDITION

Every car has:

ENGINE
TRANSMISSION
BRAKES
SUSPENSION
BODY
TIRES
PAINT

Condition is represented as percentages.

Example:

Engine 65%
Brakes 42%
Body 70%

Damaged components affect driving.

REPAIR SHOP

The player can drive to a repair shop.

Repair:

Engine
Brakes
Transmission
Suspension
Tires
Body
Paint

Repairs cost money.

After repair, driving performance improves.

CUSTOMIZATION

Allow:

Paint color
Wheels
Window tint
Spoiler
Body kit

Make the changes visible on the car whenever possible.

SELLING

The player can drive the car to the dealership / selling location.

Choose:

SELL CAR

Show:

Purchase price
Repair costs
Customization costs
Current market value
Selling price
Total profit/loss

Example:

Purchase: $25,000
Repairs: $2,000
Customization: $1,000
Sale: $34,000

PROFIT: +$6,000

TRAFFIC

Add simple AI traffic cars.

Traffic should drive around the city.

Cars should:

Follow roads

Stop at intersections

React to traffic lights

Avoid collisions where possible

Keep the traffic system lightweight for browser/mobile performance.

GRAPHICS

Create a beautiful realistic automotive visual style.

Use:

Realistic 3D-looking cars

Dynamic lighting

Shadows

Reflections

Road textures

City lights

Headlights

Brake lights

Rain reflections

Use optimized assets so the game remains playable in a browser.

PERFORMANCE

IMPORTANT:

This must be FREE to run.

Do not require paid APIs.

Do not require paid AI services.

Do not require a paid backend.

Use local assets and client-side systems whenever possible.

Use low-poly/optimized 3D models where necessary.

Target smooth performance on modern desktop browsers and Android phones.

GAME LOOP

START WITH $10,000

↓

OPEN USED CAR MARKET

↓

BUY CHEAP CAR

↓

ENTER CAR

↓

DRIVE AROUND CITY

↓

NOTICE CAR HAS PROBLEMS

↓

DRIVE TO REPAIR SHOP

↓

REPAIR CAR

↓

CUSTOMIZE CAR

↓

DRIVE AROUND

↓

RETURN TO DEALERSHIP

↓

SELL CAR

↓

MAKE PROFIT

↓

BUY BETTER CAR

↓

UNLOCK MORE EXPENSIVE CARS

↓

BECOME A CAR TYCOON

IMPORTANT

Do NOT create only a dashboard.

Do NOT create only car cards.

Do NOT make the player click "Drive" and show an animation.

The player must actually control a car in a real-time 3D driving scene.

Prioritize the playable driving prototype first:

3D map

One fully controllable car

WASD driving

Camera switching

Enter/exit car

Mobile controls

Garage

Car buying

Repair shop

Selling system

After the first car works correctly, add the other vehicles and advanced systems.

Make the first playable prototype functional before adding unnecessary UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9bc04c1d-30bc-47cd-911d-190cddd9f005).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
