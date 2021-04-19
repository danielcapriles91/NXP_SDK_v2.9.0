if(NOT MIDDLEWARE_SDMMC_SD_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_SDMMC_SD_MK66F18_INCLUDED true CACHE BOOL "middleware_sdmmc_sd component is included.")

    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/sd/fsl_sd.c
    )


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/sd
    )


    #OR Logic component
    if(CONFIG_USE_middleware_sdmmc_host_sdhc_MK66F18)
         include(middleware_sdmmc_host_sdhc_MK66F18)
    endif()
    if(CONFIG_USE_middleware_sdmmc_host_usdhc_MK66F18)
         include(middleware_sdmmc_host_usdhc_MK66F18)
    endif()
    if(CONFIG_USE_middleware_sdmmc_host_sdif_MK66F18)
         include(middleware_sdmmc_host_sdif_MK66F18)
    endif()
    if(NOT (CONFIG_USE_middleware_sdmmc_host_sdhc_MK66F18 OR CONFIG_USE_middleware_sdmmc_host_usdhc_MK66F18 OR CONFIG_USE_middleware_sdmmc_host_sdif_MK66F18))
        message(WARNING "Since middleware_sdmmc_host_sdhc_MK66F18/middleware_sdmmc_host_usdhc_MK66F18/middleware_sdmmc_host_sdif_MK66F18 is not included at first or config in config.cmake file, use middleware_sdmmc_host_usdhc_MK66F18 by default.")
        include(middleware_sdmmc_host_usdhc_MK66F18)
    endif()

    include(middleware_sdmmc_common_MK66F18)

endif()
