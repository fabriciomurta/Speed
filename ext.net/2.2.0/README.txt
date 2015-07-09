Product          : Ext.NET.Pro
Release Date     : 2013-04-18
Current Version  : 2.2.0
Previous Version : 2.1.1


--------------------------------------------------------------------------
CONTENTS
--------------------------------------------------------------------------

I.   SYSTEM REQUIREMENTS
II.  INSTALLATION INSTRUCTIONS
III. REVISIONS + BREAKING CHANGES
IV.  SAMPLE WEB.CONFIG
V.   <extnet> WEB.CONFIG GLOBAL CONFIGURATION PROPERTIES
VI.  CREDITS


--------------------------------------------------------------------------
I. SYSTEM REQUIREMENTS
--------------------------------------------------------------------------

1. Visual Studio 2008, 2010 or 2012, or
2. Visual Studio Express 2008, 2010 or 2012
3. .NET Framework 3.5, 4.0* or 4.5*

*minimum required for Ext.NET MVC

	
--------------------------------------------------------------------------
II. INSTALLATION INSTRUCTIONS
--------------------------------------------------------------------------

Getting Started (NuGet)

The easiest and quickest way to install Ext.NET is using NuGet. 
Run the following command in Visual Studio Command panel, 
or seach for "Ext.NET" in NuGet Package Manager.

    Install-Package Ext.NET


Getting Started (Manual Installation)

http://forums.ext.net/showthread.php?11027-Install-and-Setup-Guide-for-Visual-Studio


--------------------------------------------------------------------------
III. REVISIONS + BREAKING CHANGES
--------------------------------------------------------------------------

See CHANGELOG.txt and BREAKING_CHANGES.txt files included in the download package, or view online:

http://examples.ext.net/#/Getting_Started/Introduction/README/

http://examples.ext.net/#/Getting_Started/Introduction/BREAKING_CHANGES/


--------------------------------------------------------------------------
IV. SAMPLE WEB.CONFIG
--------------------------------------------------------------------------

	<?xml version="1.0"?>
	<configuration>
	  <configSections>
	    <section name="extnet" type="Ext.Net.GlobalConfig" requirePermission="false" />
	  </configSections>

	  <extnet theme="Gray" />
  
	  <system.web>
	    <httpHandlers>
	      <add path="*/ext.axd" verb="*" type="Ext.Net.ResourceHandler" validate="false" />
	    </httpHandlers>

	    <httpModules>
	      <add name="DirectRequestModule" type="Ext.Net.DirectRequestModule, Ext.Net" />
	    </httpModules>

	    <pages>
	      <controls>
	        <add assembly="Ext.Net" namespace="Ext.Net" tagPrefix="ext" />
	      </controls>
	    </pages>
	  </system.web>

	  <system.webServer>
	    <validation validateIntegratedModeConfiguration="false" />
		
	    <modules>
	      <add name="DirectRequestModule" preCondition="managedHandler" type="Ext.Net.DirectRequestModule, Ext.Net" />
	    </modules>
		
	    <handlers>
	      <add name="DirectRequestHandler" verb="*" path="*/ext.axd" preCondition="integratedMode" type="Ext.Net.ResourceHandler" />
	    </handlers>
	  </system.webServer>
  
	  <runtime>
	    <assemblyBinding xmlns="urn:schemas-microsoft-com:asm.v1">
	      <dependentAssembly>
	        <assemblyIdentity name="Newtonsoft.Json" publicKeyToken="30ad4fe6b2a6aeed" />
	        <bindingRedirect oldVersion="1.0.0.0-4.5.10" newVersion="4.5.11" />
	      </dependentAssembly>
	      <dependentAssembly>
	        <assemblyIdentity name="Ext.Net.Utilities" publicKeyToken="2c34ac34702a3c23" />
	        <bindingRedirect oldVersion="0.0.0.0-2.2.0" newVersion="2.2.1" />
	      </dependentAssembly>
	      <dependentAssembly>
	        <assemblyIdentity name="Transformer.NET" publicKeyToken="e274d618e7c603a7" />
	        <bindingRedirect oldVersion="0.0.0.0-2.1.0" newVersion="2.1.1" />
	      </dependentAssembly>
	    </assemblyBinding>
	  </runtime>
	</configuration>


--------------------------------------------------------------------------
V. <extnet> WEB.CONFIG GLOBAL CONFIGURATION PROPERTIES
--------------------------------------------------------------------------
  
    directEventUrl : string
        The url to request for all DirectEvents.
        Default is "".
                      
    directMethodProxy : ClientProxy
        Specifies whether server-side Methods marked with the [DirectMethod] attribute will output configuration script to the client. 
        If false, the DirectMethods can still be called, but the Method proxies are not automatically generated. 
        Specifies ajax method proxies creation. The Default value is to Create the proxy for each ajax method.
        Default is 'Default'. Options include [Default|Include|Ignore]
      
    ajaxViewStateMode : ViewStateMode
        Specifies whether the ViewState should be returned and updated on the client during an DirectEvent. 
        The Default value is to Exclude the ViewState from the Response.
        Default is 'Default'. Options include [Default|Exclude|Include]

    cleanResourceUrl : boolean
        The Ext.NET controls can clean up the autogenerate WebResource Url so they look presentable.        
        Default is 'true'. Options include [true|false]

    clientInitDirectMethods : boolean
        Specifies whether server-side Methods marked with the [DirectMethod] attribute will output configuration script to the client. 
        If false, the DirectMethods can still be called, but the Method proxies are not automatically generated. 
        Default is 'false'. Options include [true|false]
        
    glyphFontFamily : string
        Sets the default font-family to use for components that support a glyph config.
        Default is "".
    
    gzip : boolean
        Whether to automatically render scripts with gzip compression.        
        Only works when renderScripts="Embedded" and/or renderStyles="Embedded".       
        Default is true. Options include [true|false]

    scriptAdapter : string
        Gets or Sets the current script Adapter.     
        Default is "Ext". Options include [Ext|jQuery|Prototype|YUI]

    renderScripts : ResourceLocationType
        Whether to have the Ext.NET controls output the required JavaScript includes or not.       
        Gives developer option of manually including required <script> files.        
        Default is Embedded. Options include [Embedded|File|None] 

    renderStyles : ResourceLocationType
        Whether to have the Ext.NET controls output the required StyleSheet includes or not.       
        Gives developer option of manually including required <link> or <style> files.       
        Default is Embedded. Options include [Embedded|File|None]

    resourcePath : string
        Gets the prefix of the Url path to the base ~/Ext.Net/ folder containing the resources files for this project. 
        The path can be Absolute or Relative.
        
    resetStyles : bool
        True to reset default browser styles
        Default is false. Options include [true|false]

    scriptMode : ScriptMode
        Whether to include the Release (condensed) or Debug (with inline documentation) or Development (with inline things to debug) Ext JavaScript files.
        Default is "Release". Options include [Release|Debug|Development]
         
    sourceFormatting : boolean
        Specifies whether the scripts rendered to the page should be formatted. 'True' = formatting, 'False' = minified/compressed. 
        Default is 'false'. Options include [true|false]
      
    stateProvider : StateProvider
        Gets or Sets the current script Adapter.
        Default is 'PostBack'. Options include [PostBack|Cookie|None]
          
    theme : Theme
        Which embedded theme to use.       
        Default is "Default". Options include [Default|Access|Gray|Neptune|Slate]
          
    themePath : string
	      Configure a path to a custom theme .css file gloablly across whole application. This will override any .Theme setting. 
	      Default is "". 
  
    quickTips : boolean
        Specifies whether to render the QuickTips. Provides attractive and customizable tooltips for any element.
        Default is 'true'. Options include [true|false]

	
--------------------------------------------------------------------------
VI. CREDITS
--------------------------------------------------------------------------
	
1.  FamFamFam Icons provided by Mark James 
    http://www.famfamfam.com/lab/icons/silk/
	
    See \Build\Resources\Ext\Licenses\FamFamFam.txt for more information.

2.  Flag icons provided by Mark James 
	http://www.famfamfam.com/lab/icons/flags/

	These icons are public domain, and as such are free for any use 
	(attribution appreciated but not required).
	
    See \Build\Resources\Ext\Licenses\FlagIcons.txt for more information.

2.  Silk companion icon set #1 - "More Silk!" provided by Damien Guard
	http://www.damieng.com/icons/silkcompanion

	See \Build\Ext.Net\Licenses\SilkCompanionIcon.txt for more information.

3.  Json.NET provided by James Newton-King
    http://www.codeplex.com/json/
    
    See \Build\Ext.Net\Licenses\Newtonsoft.Json.txt
    
4.  Ext JS JavaScript Library provided by Sencha, Inc.
    http://www.sencha.com/products/js/   
    
    See \Build\Ext.Net\Licenses\ExtJS.txt


--------------------------------------------------------------------------
                               
        Copyright (c) 2007-2013 Ext.NET, Inc., All rights reserved.

                           Ext.NET, Inc.
                         support@ext.net
                           www.ext.net