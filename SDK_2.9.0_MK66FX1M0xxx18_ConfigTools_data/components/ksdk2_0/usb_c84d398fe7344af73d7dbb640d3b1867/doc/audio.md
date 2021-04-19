##Audio

The Audio Device Class support audio functions embedded in composite devices that are used to manipulate audio, voice, and sound-related functionality. This includes both audio data
(analog and digital) and the functionality that is used to directly control the audio environment, such as Volume and Tone Control. 

The USB component support Audio 1.0 class specification.

Each USB audio device is specified by Audio Interface Collection that describes an USB audio function. The Audio Interface Collection consists of the following interfaces that must be specified:
* Audio Control (AC) Interface
* Audio Streaming (AS) Interface

###Audio Control (AC) Interface
The AC Interface is used for specification of the audio function topology by using terminals and units. The USB component, Audio 1.0 class supports the following terminals and units:
* Input terminal (IT) - It is used as an interface for receiving audio information flowing into the audio function (units specified in the AC interface).
* Output terminal (OT) - It is used as an interface for outputting audio information flowing from the audio function (units specified in the AC interface).
* Feature unit (FU) - It is a multi-channel processing unit that provides basic manipulation of the incoming logical channels. For each logical channel the FU can optionally provides audio
Controls (volume, mute, tone control, equalizer, gain control, delay, ...)

The AC interface can support an optional interrupt endpoint to inform the Host about the status of the different addressable Entities (Terminals, Units, interfaces and endpoints) inside
the audio function.

###Audio Streaming (AS) Interface
AudioStreaming interfaces are used to interchange digital audio data streams between the Host and the audio function. Each Audio Streaming interface can have at most one isochronous data endpoint and 
optional associated isochronous synch endpoint for synchronization purposes. The isochronous data endpoint is required to be the first endpoint in the AS interface.

The AS interface can have alternate settings that can be used to change certain characteristics of the interface and underlying endpoint.
For example, a zero-bandwidth alternate setting can be used as the default alternate setting of the Audio Streaming interface (can be implemented by specifying zero endpoints).

The AS interface is also used for specification of the audio data format. The USB component, Audio 1.0 class supports the Format I type of audio data. 


