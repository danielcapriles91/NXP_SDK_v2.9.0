### Basic Workflow
A general process of creating a new USB device or USB host follows these steps:
* Select the *Preset* closest to the desired *Device role*/*Host role*.
* Add any aditional interfaces if needed to implement desired functionality.
* For each *Supported interface* added, select the appropriate settings.
* Click *Update Project* to generate code.
* Press each *Copy to clipboard* button you encounter and paste clipboard contents as explained in the tool tip.

### Customizing implementation code
Each preset by default generates example implementation code for the selected class. 
Use additionally the following steps to modify the initialy generated example implementation files.

* Set *Generate code example* to *Disabled* to avoid overwriting the modified class implementation files
* Further customize component settings (if needed)
* Click *Update Project*.   
  Please note that the files that are ready to be modified are marked with 'U' (as user files). 
  Such files will not be modified (regenerated and written to disk) from now on. 

See [Use cases](useCases.md) for details on individual presets/examples.

Note: Selection of the Disable value in the Generate code example setting impacts the code example files only. When any class interface setting is modified the updated source code is generated and the MCUXpresso IDE project can be updated by using the *Update Code* dialog.  