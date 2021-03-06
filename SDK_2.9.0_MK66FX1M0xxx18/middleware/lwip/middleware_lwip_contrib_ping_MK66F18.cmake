if(NOT MIDDLEWARE_LWIP_CONTRIB_PING_MK66F18_INCLUDED)
    
    set(MIDDLEWARE_LWIP_CONTRIB_PING_MK66F18_INCLUDED true CACHE BOOL "middleware_lwip_contrib_ping component is included.")

    target_sources(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/contrib/apps/ping/ping.c
    )


    target_include_directories(${MCUX_SDK_PROJECT_NAME} PRIVATE
        ${CMAKE_CURRENT_LIST_DIR}/contrib/apps/ping
    )


    include(middleware_lwip_MK66F18)

endif()
